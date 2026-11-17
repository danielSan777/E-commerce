import { AnalyticsService } from '../../../../core/seguimiento/AnalyticsService';
import { Component, afterNextRender, computed, effect, inject, signal, untracked } from '@angular/core';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CalendarioVentanas } from '../../../../shared/componentes/calendario-ventanas/calendario-ventanas';
import { CarritoService } from '../../../../carrito/aplicacion/servicios/CarritoService';
import { EnvioGratisService } from '../../../../catalogo/aplicacion/servicios/EnvioGratisService';
import { CheckoutService, DatosCheckout } from '../../../aplicacion/servicios/CheckoutService';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';
import { PedidoService } from '../../../aplicacion/servicios/PedidoService';
import { PromesaService } from '../../../aplicacion/servicios/PromesaService';
import { EntregaPedido, VentanaDisponible } from '../../../dominio/interfaces/promesa';
import { textoVentana } from '../../../dominio/validaciones/fechas';
import { UbicacionesService } from '../../../aplicacion/servicios/UbicacionesService';
import { MENSAJE_SIN_ENVIO } from '../../../dominio/validaciones/envio';

function formatearCentavos(c: number): string {
  return `$${(c / 100).toFixed(2)}`;
}

type Metodo = DatosCheckout['metodoPago'];

@Component({
  selector: 'app-pago',
  imports: [CurrencyPipe, RouterLink, CalendarioVentanas],
  templateUrl: './pago.html',
  styleUrl: './pago.css',
})
export class Pago {

  // ===== EDITABLES =====
  readonly RUTA_VOLVER = '/checkout';
  readonly RUTA_CONFIRMAR = '/checkout/confirmacion';  // "Confirmar pedido"
  readonly RUTA_CATALOGO = '/categorias';

  // Las tarifas y la zona de cada cantón las edita el administrador (panel > Envíos) y llegan desde Laravel
  readonly RECARGO_PAYPHONE = 0.06;  // 6 % sobre (subtotal + envío) cuando se paga con tarjeta

  private carrito = inject(CarritoService);
  private checkout = inject(CheckoutService);
  private pedidos = inject(PedidoService);
  private router = inject(Router);
  private promesas = inject(PromesaService);
  private ubicaciones = inject(UbicacionesService);
  private avisos = inject(AvisosService);

  items = this.carrito.items;
  cantidad = this.carrito.cantidad;
  subtotal = this.carrito.subtotal;
  envioGratis = inject(EnvioGratisService).envioGratis;

  datos = this.checkout.datos;
  metodo = computed<Metodo>(() => this.datos().metodoPago);

  // ===== Fecha de entrega: la promesa y las ventanas las entrega Laravel (hoy, un mock) =====
  promesa = this.promesas.promesa;
  contador = this.promesas.contador;
  ventanas = this.promesas.ventanas;
  textoVentana = textoVentana;
  entrega = computed(() => this.datos().entrega);
  ventanaElegida = computed(() =>
    this.ventanas().find(v => v.start === this.datos().ventanaInicio && v.end === this.datos().ventanaFin && v.available));
  esAmazonia = computed(() => this.ubicaciones.diaAdicional(this.datos().provincia, this.datos().canton));

  entregaPedido = computed<EntregaPedido | null>(() => {
    const p = this.promesa();
    if (!p) return null;
    if (this.entrega() === 'inmediata') {
      return { tipo: 'inmediata', window: p.window, label: p.label, promise_token: p.promise_token };
    }
    const v = this.ventanaElegida();
    return v
      ? { tipo: 'programada', window: { start: v.start, end: v.end }, label: textoVentana(v.start, v.end), promise_token: p.promise_token }
      : null;
  });

  // ===== Casillas (siempre empiezan desmarcadas) =====
  aceptaTerminos = signal(false);
  intentoConfirmar = signal(false);
  errorTerminos = computed(() => this.intentoConfirmar() && !this.aceptaTerminos());
  enviando = signal(false);
  errorPedido = signal('');   // por qué Laravel no aceptó el pedido (precio, fecha, cupo, datos)
  errorEntrega = computed(() => this.intentoConfirmar() && !this.entregaPedido());

  // Hasta que se lean los datos guardados no se sabe si falta algo
  datosListos = signal(false);
  faltanDatos = computed(() => this.datosListos() && (!this.datos().provincia || !this.datos().canton));

  textoProductos = computed(() => `${this.cantidad()} ${this.cantidad() === 1 ? 'producto' : 'productos'}`);

  // Galápagos: no hay envío, no se puede pagar el pedido
  sinEnvio = computed(() => !this.ubicaciones.disponible(this.datos().provincia, this.datos().canton));
  readonly MENSAJE_GALAPAGOS = MENSAJE_SIN_ENVIO;

  // Tarifa según el cantón y la provincia elegidos en "Envío y facturación"
  tarifaEnvio = computed(() => this.ubicaciones.costo(this.datos().provincia, this.datos().canton));
  envio = computed(() => (this.envioGratis() ? 0 : this.tarifaEnvio()));

  // Total por transferencia (sin cargo adicional)
  totalTransferencia = computed(() => this.subtotal() + this.envio());

  // Cargo de PayPhone en dólares, redondeado a centavos
  recargoPayphone = computed(() => Math.round(this.totalTransferencia() * 100 * this.RECARGO_PAYPHONE) / 100);

  totalPayphone = computed(() => this.totalTransferencia() + this.recargoPayphone());

  // Lo que se muestra en "Tu pedido"
  totalFinal = computed(() => (this.metodo() === 'payphone' ? this.totalPayphone() : this.totalTransferencia()));

  porcentajeTexto = Math.round(this.RECARGO_PAYPHONE * 100);

  private analytics = inject(AnalyticsService);

  constructor() {
    this.ubicaciones.cargar();
    // La promesa y las ventanas se piden al destino elegido: la Amazonía suma un día (Laravel lo calcula)
    effect(() => {
      const d = this.datos();
      const codigo = this.ubicaciones.codigoCanton(d.provincia, d.canton);
      // Con cantón elegido se espera a tener la lista de ubicaciones para conocer su código
      if (this.datosListos() && (this.ubicaciones.listo() || !d.canton)) untracked(() => this.promesas.cargar(codigo));
    });
    // Una ventana guardada en otra visita puede haber quedado en el pasado: Laravel ya no la ofrece
    effect(() => {
      const d = this.datos();
      this.ventanas();
      if (!this.datosListos() || !this.ventanas().length || d.entrega !== 'programada') return;
      if (!this.promesas.esVigente(d.ventanaInicio, d.ventanaFin)) {
        untracked(() => {
          this.checkout.actualizar({ entrega: 'inmediata', ventanaInicio: '', ventanaFin: '' });
          this.avisos.exito('Actualizamos tu fecha estimada.');
        });
      }
    });
    // Solo en el navegador: así el servidor y el cliente pintan lo mismo en el primer render
    afterNextRender(() => {
      this.checkout.restaurar();
      this.datosListos.set(true);
    });
  }

  // Si la foto del producto no existe, se oculta y queda el fondo
  sinImagen(evento: Event): void {
    (evento.target as HTMLImageElement).style.visibility = 'hidden';
  }

  elegirEntrega(tipo: 'inmediata' | 'programada'): void {
    if (tipo === 'inmediata') {
      this.checkout.actualizar({ entrega: 'inmediata', ventanaInicio: '', ventanaFin: '' });
      return;
    }
    const primera = this.ventanaElegida() ?? this.ventanas().find(v => v.available);
    this.checkout.actualizar({ entrega: 'programada', ventanaInicio: primera?.start ?? '', ventanaFin: primera?.end ?? '' });
  }

  elegirVentana(v: VentanaDisponible): void {
    if (!v.available) return;
    this.analytics.track('select_delivery_window', { start: v.start, end: v.end });
    this.checkout.actualizar({ entrega: 'programada', ventanaInicio: v.start, ventanaFin: v.end });
  }

  elegir(metodo: Metodo): void {
    this.checkout.actualizar({ metodoPago: metodo });
    this.analytics.track('add_payment_info', { payment_type: metodo === 'payphone' ? 'card' : 'transfer' });
  }

  confirmar(): void {
    if (this.faltanDatos() || this.sinEnvio() || this.cantidad() === 0) return;

    this.intentoConfirmar.set(true);
    const entrega = this.entregaPedido();
    if (!this.aceptaTerminos() || !entrega) return;

    if (this.enviando()) return;

    const payphone = this.metodo() === 'payphone';
    this.enviando.set(true);
    this.errorPedido.set('');

    this.pedidos.crear({
      metodo: this.metodo(),
      items: this.items(),
      datos: this.datos(),
      subtotal: this.subtotal(),
      envio: this.envio(),
      envioGratis: this.envioGratis(),
      recargo: payphone ? this.recargoPayphone() : 0,
      total: this.totalFinal(),
      entrega,
    }).subscribe({
      next: () => {
        // El carrito se vacía cuando ya se llegó a la confirmación (el pedido quedó guardado aparte)
        this.router.navigateByUrl(this.RUTA_CONFIRMAR).then(ok => {
          this.enviando.set(false);
          if (ok) this.carrito.vaciar();
        });
      },
      error: (e: ErrorApi) => {
        this.enviando.set(false);
        this.mostrarRechazo(e);
      },
    });
  }

  /** Laravel rechazó el pedido: se explica qué cambió y se actualiza lo que Angular muestra (nada se calcula aquí). */
  private mostrarRechazo(e: ErrorApi): void {
    const d = e.details ?? {};
    let texto = e.message;

    switch (e.code) {
      case 'price_changed':
        // Los precios y tarifas pueden haber cambiado: se vuelven a pedir las zonas
        this.ubicaciones.recargar();
        if (typeof d['total_cents'] === 'number') texto = `${e.message} El total ahora es ${formatearCentavos(d['total_cents'])}.`;
        break;
      case 'window_changed':
      case 'window_unavailable':
      case 'capacity_full':
        // Fecha distinta o sin cupo: se vuelve a pedir la promesa y se vuelve a la entrega estimada
        this.checkout.actualizar({ entrega: 'inmediata', ventanaInicio: '', ventanaFin: '' });
        this.promesas.cargar(this.ubicaciones.codigoCanton(this.datos().provincia, this.datos().canton), true);
        if (e.code === 'window_changed' && typeof d['label'] === 'string') texto = `${e.message} Ahora: ${d['label']}.`;
        break;
      case 'validation_error': {
        const [clave, mensajes] = Object.entries(e.errors ?? {})[0] ?? ['', []];
        const primero = mensajes[0];
        // Un error de una maceta (accesorios, colores, frase o foto del marco) se explica con su nombre
        const maceta = /^items\.(\d+)\./.exec(clave);
        const nombre = maceta ? this.items()[Number(maceta[1])]?.producto.nombre : undefined;
        texto = !primero ? e.message
          : nombre ? `Revisa tu maceta «${nombre}»: ${primero} Edítala desde el carrito.`
          : `${e.message} ${primero}`;
        break;
      }
    }

    this.errorPedido.set(texto);
    this.avisos.error(texto);
  }
}