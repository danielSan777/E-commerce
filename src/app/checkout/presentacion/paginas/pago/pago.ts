import { AnalyticsService } from '../../../../core/seguimiento/AnalyticsService';
import { Component, afterNextRender, computed, effect, inject, signal, untracked } from '@angular/core';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CalendarioVentanas } from '../../../../shared/componentes/calendario-ventanas/calendario-ventanas';
import { CarritoService } from '../../../../carrito/aplicacion/servicios/CarritoService';
import { CotizacionService } from '../../../../carrito/aplicacion/servicios/CotizacionService';
import { parametrosDeCarrito } from '../../../../core/seguimiento/ParametrosComercio';
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

/** Centavos que entregó Laravel → dólares para mostrar; sin dato se usa el respaldo (lo que ya había en pantalla). */
const dolares = (centavos: number | null | undefined, respaldo = 0): number => (centavos == null ? respaldo : centavos / 100);

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
  readonly RUTA_TARJETA = '/checkout/tarjeta';          // Cajita de PayPhone
  readonly RUTA_CATALOGO = '/categorias';

  // Las tarifas y la zona de cada cantón las edita el administrador (panel > Envíos) y llegan desde Laravel

  private carrito = inject(CarritoService);
  private checkout = inject(CheckoutService);
  private pedidos = inject(PedidoService);
  private router = inject(Router);
  private promesas = inject(PromesaService);
  private ubicaciones = inject(UbicacionesService);
  private avisos = inject(AvisosService);
  private cotizador = inject(CotizacionService);

  items = this.carrito.items;
  cantidad = this.carrito.cantidad;
  subtotal = computed(() => dolares(this.cotizador.cotizacion()?.subtotal_cents, this.carrito.subtotal()));
  private promo = inject(EnvioGratisService);
  envioGratis = this.promo.envioGratis;
  // Descuento por segunda maceta (modo "todo gratis"); 0 en el modo estándar
  descuento = this.promo.descuento;

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

  // Envío, recargo y totales: los calcula Laravel (cotización del carrito con el cantón elegido); aquí solo se muestran
  private cot = this.cotizador.cotizacion;

  envio = computed(() => dolares(this.cot()?.shipping_cents));
  recargoPayphone = computed(() => dolares(this.cot()?.card_fee_cents));
  totalTransferencia = computed(() => dolares(this.cot()?.total_transfer_cents, this.subtotal() - this.descuento()));
  totalPayphone = computed(() => dolares(this.cot()?.total_card_cents, this.subtotal() - this.descuento()));
  // Lo que se muestra en "Tu pedido"
  totalFinal = computed(() => (this.metodo() === 'payphone' ? this.totalPayphone() : this.totalTransferencia()));
  /** Hasta que Laravel responda con el total de este carrito y este cantón no se puede confirmar. */
  totalListo = computed(() => !this.cotizador.calculando() && !this.cotizador.fallo() && this.cot()?.total_transfer_cents != null);
  errorCotizacion = this.cotizador.fallo;

  porcentajeTexto = computed(() => Number(this.promo.recargoPorcentaje().toFixed(2)));
  porcentajeDescuento = computed(() => this.promo.pct());

  private analytics = inject(AnalyticsService);

  constructor() {
    this.ubicaciones.cargar();
    // El cantón elegido se le pasa a la cotización: Laravel responde con el envío, el recargo y los totales de ese destino
    effect(() => {
      const d = this.datos();
      const codigo = this.ubicaciones.codigoCanton(d.provincia, d.canton);
      this.cotizador.canton.set(this.ubicaciones.listo() || !d.canton ? codigo : '');
    });
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

  reintentarCotizacion(): void { this.cotizador.recargar(); }

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
    this.analytics.track('add_payment_info', { ...parametrosDeCarrito(this.items(), this.cot()), payment_type: metodo === 'payphone' ? 'card' : 'transfer' });
  }

  confirmar(): void {
    if (this.faltanDatos() || this.sinEnvio() || this.cantidad() === 0 || !this.totalListo()) return;

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
      envioGratis: this.envio() === 0,   // tarifa $0 también se muestra como "Envío gratis"
      descuento: this.descuento(),
      recargo: payphone ? this.recargoPayphone() : 0,
      total: this.totalFinal(),
      entrega,
    }).subscribe({
      next: () => {
        // Con tarjeta el pedido queda sin pagar: se sigue a la Cajita y el carrito se vacía cuando PayPhone confirme el cobro
        if (payphone) {
          this.router.navigateByUrl(this.RUTA_TARJETA).then(() => this.enviando.set(false));
          return;
        }
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
        this.cotizador.recargar();
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