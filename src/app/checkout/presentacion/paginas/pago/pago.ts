import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CarritoService } from '../../../../carrito/aplicacion/servicios/CarritoService';
import { EnvioGratisService } from '../../../../catalogo/aplicacion/servicios/EnvioGratisService';
import { CheckoutService, DatosCheckout } from '../../../aplicacion/servicios/CheckoutService';
import { PedidoService } from '../../../aplicacion/servicios/PedidoService';
import { PromesaService } from '../../../aplicacion/servicios/PromesaService';
import { EntregaPedido, VentanaDisponible } from '../../../dominio/interfaces/promesa';
import { textoVentana } from '../../../dominio/validaciones/fechas';
import { costoEnvio, envioDisponible, MENSAJE_GALAPAGOS, zonaEnvio } from '../../../dominio/validaciones/envio';

type Metodo = DatosCheckout['metodoPago'];

@Component({
  selector: 'app-pago',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './pago.html',
  styleUrl: './pago.css',
})
export class Pago {

  // ===== EDITABLES =====
  readonly RUTA_VOLVER = '/checkout';
  readonly RUTA_CONFIRMAR = '/checkout/confirmacion';  // "Confirmar pedido"
  readonly RUTA_CATALOGO = '/categorias';

  // Las tarifas de envío por cantón están en dominio/validaciones/envio.ts
  readonly RECARGO_PAYPHONE = 0.06;  // 6 % sobre (subtotal + envío) cuando se paga con tarjeta

  private carrito = inject(CarritoService);
  private checkout = inject(CheckoutService);
  private pedidos = inject(PedidoService);
  private router = inject(Router);
  private promesas = inject(PromesaService);

  items = this.carrito.items;
  cantidad = this.carrito.cantidad;
  subtotal = this.carrito.subtotal;
  envioGratis = inject(EnvioGratisService).envioGratis;

  datos = this.checkout.datos;
  metodo = computed<Metodo>(() => this.datos().metodoPago);

  // ===== Fecha de entrega: la promesa y las ventanas las entrega Laravel (hoy, un mock) =====
  promesa = this.promesas.promesa();
  ventanas = this.promesas.ventanas().windows;
  textoVentana = textoVentana;
  entrega = computed(() => this.datos().entrega);
  ventanaElegida = computed(() =>
    this.ventanas.find(v => v.start === this.datos().ventanaInicio && v.end === this.datos().ventanaFin && v.available));
  esAmazonia = computed(() => zonaEnvio(this.datos().provincia, this.datos().canton) === 'amazonia');

  entregaPedido = computed<EntregaPedido | null>(() => {
    if (this.entrega() === 'inmediata') {
      return { tipo: 'inmediata', window: this.promesa.window, label: this.promesa.label, promise_token: this.promesa.promise_token };
    }
    const v = this.ventanaElegida();
    return v
      ? { tipo: 'programada', window: { start: v.start, end: v.end }, label: textoVentana(v.start, v.end), promise_token: this.promesa.promise_token }
      : null;
  });

  // ===== Casillas (siempre empiezan desmarcadas) =====
  aceptaTerminos = signal(false);
  aceptaMarketing = signal(false);
  intentoConfirmar = signal(false);
  errorTerminos = computed(() => this.intentoConfirmar() && !this.aceptaTerminos());
  errorEntrega = computed(() => this.intentoConfirmar() && !this.entregaPedido());

  // Hasta que se lean los datos guardados no se sabe si falta algo
  datosListos = signal(false);
  faltanDatos = computed(() => this.datosListos() && (!this.datos().provincia || !this.datos().canton));

  textoProductos = computed(() => `${this.cantidad()} ${this.cantidad() === 1 ? 'producto' : 'productos'}`);

  // Galápagos: no hay envío, no se puede pagar el pedido
  sinEnvio = computed(() => !envioDisponible(this.datos().provincia, this.datos().canton));
  readonly MENSAJE_GALAPAGOS = MENSAJE_GALAPAGOS;

  // Tarifa según el cantón y la provincia elegidos en "Envío y facturación"
  tarifaEnvio = computed(() => costoEnvio(this.datos().provincia, this.datos().canton));
  envio = computed(() => (this.envioGratis() ? 0 : this.tarifaEnvio()));

  // Total por transferencia (sin cargo adicional)
  totalTransferencia = computed(() => this.subtotal() + this.envio());

  // Cargo de PayPhone en dólares, redondeado a centavos
  recargoPayphone = computed(() => Math.round(this.totalTransferencia() * 100 * this.RECARGO_PAYPHONE) / 100);

  totalPayphone = computed(() => this.totalTransferencia() + this.recargoPayphone());

  // Lo que se muestra en "Tu pedido"
  totalFinal = computed(() => (this.metodo() === 'payphone' ? this.totalPayphone() : this.totalTransferencia()));

  porcentajeTexto = Math.round(this.RECARGO_PAYPHONE * 100);

  constructor() {
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
    const primera = this.ventanaElegida() ?? this.ventanas.find(v => v.available);
    this.checkout.actualizar({ entrega: 'programada', ventanaInicio: primera?.start ?? '', ventanaFin: primera?.end ?? '' });
  }

  elegirVentana(v: VentanaDisponible): void {
    if (!v.available) return;
    this.checkout.actualizar({ entrega: 'programada', ventanaInicio: v.start, ventanaFin: v.end });
  }

  elegir(metodo: Metodo): void {
    this.checkout.actualizar({ metodoPago: metodo });
  }

  confirmar(): void {
    if (this.faltanDatos() || this.sinEnvio() || this.cantidad() === 0) return;

    this.intentoConfirmar.set(true);
    const entrega = this.entregaPedido();
    if (!this.aceptaTerminos() || !entrega) return;

    const payphone = this.metodo() === 'payphone';

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
      marketing: this.aceptaMarketing(),
    });

    // El carrito se vacía cuando ya se llegó a la confirmación (el pedido quedó guardado aparte)
    this.router.navigateByUrl(this.RUTA_CONFIRMAR).then(ok => {
      if (ok) this.carrito.vaciar();
    });
  }
}