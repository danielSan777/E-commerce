import { Component, DestroyRef, OnInit, afterNextRender, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { aCsv, descargarTexto } from '../../../aplicacion/csv';
import { centavosADolares } from '../../../aplicacion/dinero';
import { instanteEnGuayaquil } from '../../../aplicacion/fechas';
import { FiltrosExtraPedidos, PedidosAdminService } from '../../../aplicacion/servicios/PedidosAdminService';
import { descargarEtiquetaImagen, descargarEtiquetaPdf, datosDeEtiqueta } from '../../../aplicacion/servicios/EtiquetaEnvio';
import { EstadoPedidoAdmin, EventoPedido, FiltroPedidos, OrdenProduccion, PedidoAdmin, estadoDePedido } from '../../../dominio/interfaces/pedidos-admin';

type Accion = 'pagar' | 'pagar_tarde' | 'cancelar' | 'reembolsar' | 'mover_ciclo';

/** La guía de Servientrega: letras, números y guiones, de 5 a 40 caracteres (Laravel valida lo mismo). */
export function guiaValida(guia: string): boolean {
  return /^[A-Za-z0-9-]{5,40}$/.test(guia.trim());
}

/** "mar 17 nov, 13:50" en la hora de Ecuador. */
export function fechaHora(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-EC', { timeZone: 'America/Guayaquil', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

/** "12 nov – 13 nov" para fechas de negocio (YYYY-MM-DD, sin convertir de zona). */
export function ventana(v: { start: string; end: string }): string {
  const f = (s: string) => new Intl.DateTimeFormat('es-EC', { timeZone: 'UTC', day: 'numeric', month: 'short' }).format(new Date(`${s}T00:00:00Z`));
  return `${f(v.start)} – ${f(v.end)}`;
}

/** "miércoles 27 de nov": día límite de envío (fecha de negocio YYYY-MM-DD, sin convertir de zona). */
export function diaDeEnvio(fecha: string): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-EC', { timeZone: 'UTC', ...o }).format(d);
  return `${f({ weekday: 'long' })} ${f({ day: 'numeric' })} de ${f({ month: 'short' }).replace('.', '')}`;
}

/** Tiempo que falta (o que pasó) hasta el fin del plazo de envío, en días y horas. `limiteIso` lo calcula Laravel. */
export function plazoDeEnvio(limiteIso: string, ahoraMs: number): { texto: string; nivel: 'ok' | 'pronto' | 'hoy' | 'vencido' } {
  const resta = new Date(limiteIso).getTime() - ahoraMs;
  const horasTotales = Math.floor(Math.abs(resta) / 3_600_000);
  const dias = Math.floor(horasTotales / 24), horas = horasTotales % 24;
  const u = (n: number, s: string) => `${n} ${s}${n === 1 ? '' : 's'}`;
  const partes = [dias ? u(dias, 'día') : '', horas ? u(horas, 'hora') : ''].filter(Boolean).join(' y ');
  if (resta <= 0) return { texto: horasTotales < 1 ? 'Plazo vencido hace menos de 1 hora' : `Plazo vencido hace ${partes}`, nivel: 'vencido' };
  // El día de envío (hora de Ecuador) el aviso es «ENVÍO VENCE HOY», con lo que falta del día.
  const diaEcuador = (ms: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(ms);
  if (diaEcuador(ahoraMs) === diaEcuador(new Date(limiteIso).getTime())) {
    return { texto: `ENVÍO VENCE HOY · ${horasTotales < 1 ? 'falta menos de 1 hora' : `${horas === 1 ? 'falta' : 'faltan'} ${u(horas, 'hora')}`}`, nivel: 'hoy' };
  }
  if (horasTotales < 1) return { texto: 'Falta menos de 1 hora para enviar', nivel: 'pronto' };
  return { texto: `${(dias === 1 && !horas) || (!dias && horas === 1) ? 'Falta' : 'Faltan'} ${partes} para enviar`, nivel: dias < 1 ? 'pronto' : 'ok' };
}

// Pedidos en el panel (Paso 14): lista con filtros, comprobante, "Marcar pagado", "Pagado fuera de plazo" y "Cancelar".
@Component({
  selector: 'app-admin-pedidos',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class AdminPedidos implements OnInit {
  private servicio = inject(PedidosAdminService);
  private avisos = inject(AvisosService);
  private destroyRef = inject(DestroyRef);

  readonly filtros: { valor: FiltroPedidos; etiqueta: string }[] = [
    { valor: 'pending', etiqueta: 'Por validar' },
    { valor: 'in_production', etiqueta: 'En producción' }, { valor: 'shipped', etiqueta: 'Enviados' },
    { valor: 'expired', etiqueta: 'Vencidos' }, { valor: 'cancelled', etiqueta: 'Cancelados' }, { valor: 'all', etiqueta: 'Todos' },
  ];
  readonly ETIQUETAS: Record<EstadoPedidoAdmin, string> = { pending: 'Pendiente de pago', in_production: 'En producción', shipped: 'Enviado', expired: 'Vencido', cancelled: 'Cancelado' };
  readonly fechaHora = fechaHora;
  readonly ventana = ventana;
  readonly estado = estadoDePedido;
  readonly diaDeEnvio = diaDeEnvio;
  readonly plazo = plazoDeEnvio;
  readonly ordenes: { valor: OrdenProduccion; etiqueta: string }[] = [{ valor: 'due', etiqueta: 'Por vencimiento' }, { valor: 'amount', etiqueta: 'Por monto' }];

  filtro = signal<FiltroPedidos>('pending');
  orden = signal<OrdenProduccion>('due');                  // solo en «En producción»: por vencimiento (default) o por monto
  ahora = signal(Date.now());                              // reloj de los temporizadores; se actualiza cada minuto
  canal = signal<'web' | 'whatsapp' | ''>('');              // filtros de operación (vacío = todos)
  pago = signal<'transfer' | 'card' | ''>('');
  ciclo = signal('');                                       // fecha del ciclo YYYY-MM-DD
  exportando = signal(false);
  busqueda = signal('');                                   // código escrito en el buscador (se mantiene al cambiar de lista)
  private espera?: ReturnType<typeof setTimeout>;
  pedidos = signal<PedidoAdmin[]>([]);
  abierto = signal<string | null>(null);
  cargando = signal(true);
  error = signal('');
  trabajando = signal<string | null>(null);              // número del pedido con una acción en curso
  confirmando = signal<{ numero: string; accion: Accion } | null>(null);
  notificarCancelacion = signal(false);                    // «Notificar al comprador» al cancelar
  motivoCancelacion = signal('');
  montoReembolso = signal('');                              // dólares escritos al cancelar o al registrar un reembolso
  errorReembolso = signal('');
  retraso = signal<{ numero: string; inicio: string; fin: string; motivo: string } | null>(null);   // formulario «Avisar retraso» abierto
  errorRetraso = signal('');
  guia = signal('');                                       // guía escrita para marcar «Enviado»
  errorGuia = signal('');
  historial = signal<{ numero: string; eventos: EventoPedido[] | null; error: boolean } | null>(null);   // historial del pedido abierto
  sobrecupo = signal<{ numero: string; mensaje: string } | null>(null);   // Laravel pidió confirmar que se pasa del límite

  constructor() {
    // El reloj corre solo en el navegador (no en el servidor SSR) y se detiene al salir de la pantalla.
    afterNextRender(() => {
      this.ahora.set(Date.now());
      const reloj = setInterval(() => this.ahora.set(Date.now()), 60_000);
      this.destroyRef.onDestroy(() => clearInterval(reloj));
    });
  }

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => clearTimeout(this.espera));
    this.cargar();
  }

  elegirOrden(o: OrdenProduccion): void {
    this.orden.set(o);
    this.abierto.set(null);
    this.cargar();
  }

  /** Busca por código mientras se escribe, sin pedir a Laravel en cada letra. */
  buscar(texto: string): void {
    this.busqueda.set(texto);
    this.abierto.set(null);
    clearTimeout(this.espera);
    this.espera = setTimeout(() => this.cargar(), 300);
  }

  limpiarBusqueda(): void {
    clearTimeout(this.espera);
    this.busqueda.set('');
    this.abierto.set(null);
    this.cargar();
  }

  private extras = (limite?: number): FiltrosExtraPedidos => ({ canal: this.canal(), pago: this.pago(), ciclo: this.ciclo().trim(), limite });

  hayFiltrosExtra = () => !!(this.canal() || this.pago() || this.ciclo());

  elegirCanal(v: string): void { this.canal.set(v === 'web' || v === 'whatsapp' ? v : ''); this.abierto.set(null); this.cargar(); }
  elegirPago(v: string): void { this.pago.set(v === 'transfer' || v === 'card' ? v : ''); this.abierto.set(null); this.cargar(); }
  elegirCiclo(v: string): void { this.ciclo.set(/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : ''); this.abierto.set(null); this.cargar(); }

  limpiarFiltrosExtra(): void { this.canal.set(''); this.pago.set(''); this.ciclo.set(''); this.abierto.set(null); this.cargar(); }

  /** CSV de lo que muestran los filtros actuales (hasta 2000 pedidos), con dinero en dólares. */
  exportarCsv(): void {
    if (this.exportando()) return;
    this.exportando.set(true);
    this.servicio.listar(this.filtro(), this.busqueda(), this.orden(), this.extras(2000)).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.exportando.set(false))).subscribe({
      next: lista => {
        const datos = [['Pedido', 'Creado', 'Estado', 'Pago', 'Método de pago', 'Canal', 'Ciclo', 'Despacho', 'Entrega desde', 'Entrega hasta', 'Comprador', 'Correo', 'Celular', 'Provincia', 'Cantón', 'Subtotal ítems', 'Descuento', 'Envío', 'Recargo tarjeta', 'Total', 'Guía']]
          .concat(lista.map(p => [p.number, instanteEnGuayaquil(p.created_at), this.ETIQUETAS[estadoDePedido(p)], p.payment_status, p.payment_method === 'card' ? 'Tarjeta' : 'Transferencia', p.channel, p.cycle_date, p.dispatch_date, p.window.start, p.window.end,
            p.customer.name, p.customer.email, p.customer.phone ?? '', p.shipping.province_name ?? '', p.shipping.canton_name ?? '',
            centavosADolares(p.items.reduce((t, i) => t + i.line_total_cents, 0)), centavosADolares(p.discount_cents), centavosADolares(p.shipping_cents), centavosADolares(p.card_fee_cents), centavosADolares(p.total_cents), p.tracking_number ?? '']));
        descargarTexto(`pedidos-${this.filtro()}.csv`, aCsv(datos));
        this.avisos.exito(`${lista.length} pedido(s) exportados.`);
      },
      error: (e: ErrorApi) => this.avisos.error(e.message),
    });
  }

  elegirFiltro(f: FiltroPedidos): void {
    this.filtro.set(f);
    this.abierto.set(null);
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.servicio.listar(this.filtro(), this.busqueda(), this.orden(), this.extras()).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false))).subscribe({
      next: p => this.pedidos.set(p),
      error: (e: ErrorApi) => this.error.set(e.message),
    });
  }

  alternar(numero: string): void {
    this.abierto.set(this.abierto() === numero ? null : numero);
    this.confirmando.set(null);
    this.sobrecupo.set(null);
    this.errorGuia.set('');
    this.guia.set(this.pedidos().find(p => p.number === numero)?.tracking_number ?? '');
    this.historial.set(null);
    if (this.abierto() === numero) this.cargarHistorial(numero);
  }

  /** Pide a Laravel el historial del pedido abierto (qué pasó, cuándo y quién). */
  private cargarHistorial(numero: string): void {
    this.historial.set({ numero, eventos: null, error: false });
    this.servicio.historial(numero).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: eventos => { if (this.historial()?.numero === numero) this.historial.set({ numero, eventos, error: false }); },
      error: () => { if (this.historial()?.numero === numero) this.historial.set({ numero, eventos: null, error: true }); },
    });
  }

  reintentarHistorial(numero: string): void { this.cargarHistorial(numero); }

  /** Quién hizo el hecho, en palabras. */
  autor(e: EventoPedido): string {
    return e.actor === 'buyer' ? 'Comprador' : e.actor === 'admin' ? (e.actor_name || 'Administrador') : 'Sistema';
  }

  pedirConfirmacion(numero: string, accion: Accion): void {
    this.sobrecupo.set(null);
    this.montoReembolso.set('');
    this.errorReembolso.set('');
    this.confirmando.set({ numero, accion });
  }

  readonly COLORES: Record<string, string> = { negro: 'negro', cafe: 'café', dorado: 'dorado' };
  color = (c: string | null | undefined) => (c ? (this.COLORES[c] ?? c) : '');

  /** Abre la foto de la maceta o la del marco en otra pestaña. */
  verImagen(p: PedidoAdmin, item: number, cual: 'preview' | 'frame-photo'): void {
    this.trabajando.set(p.number);
    this.servicio.imagenDelItem(p.number, item, cual).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.trabajando.set(null))).subscribe({
      next: blob => this.abrirArchivo(blob),
      error: (e: ErrorApi) => this.avisos.error(e.message),
    });
  }

  private abrirArchivo(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  /** Abre el comprobante en otra pestaña. */
  verComprobante(p: PedidoAdmin): void {
    this.trabajando.set(p.number);
    this.servicio.comprobante(p.number).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.trabajando.set(null))).subscribe({
      next: blob => this.abrirArchivo(blob),
      error: (e: ErrorApi) => this.avisos.error(e.message),
    });
  }

  ejecutar(p: PedidoAdmin, accion: Accion, confirmarSobrecupo = false): void {
    this.trabajando.set(p.number);
    const llamada = accion === 'cancelar' ? this.servicio.cancelar(p.number, { notificar: this.notificarCancelacion(), motivo: this.motivoCancelacion(), reembolso: this.montoReembolso() })
      : accion === 'reembolsar' ? this.servicio.registrarReembolso(p.number, this.montoReembolso())
      : accion === 'mover_ciclo' ? this.servicio.moverDeCiclo(p.number, confirmarSobrecupo)
     
      : this.servicio.marcarPagado(p.number, { fueraDePlazo: accion === 'pagar_tarde', confirmarSobrecupo });

    llamada.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.trabajando.set(null))).subscribe({
      next: nuevo => {
        this.confirmando.set(null);
        this.sobrecupo.set(null);
        this.notificarCancelacion.set(false);
        this.motivoCancelacion.set('');
        this.montoReembolso.set('');
        this.errorReembolso.set('');
        this.avisos.exito(accion === 'reembolsar' ? `Reembolso de ${p.number} registrado.` : accion === 'mover_ciclo' ? `Pedido ${p.number} pasado al siguiente ciclo; el comprador recibió su nueva fecha.` : accion === 'cancelar' ? `Pedido ${p.number} cancelado.` : `Pedido ${p.number} marcado como pagado.`);
        this.reemplazar(nuevo);
        if (accion === 'mover_ciclo' && this.abierto() === p.number) this.cargarHistorial(p.number);
      },
      error: (e: ErrorApi) => {
        if (e.code === 'capacity_over_limit') this.sobrecupo.set({ numero: p.number, mensaje: e.message });
        else if (e.errors?.['refund_amount']) this.errorReembolso.set(e.errors['refund_amount'][0]);
        else { this.confirmando.set(null); this.avisos.error(e.message); }
      },
    });
  }

  /** Copia el correo del cliente al portapapeles (con respaldo para navegadores sin permiso). */
  async copiarCorreo(correo: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(correo);
    } catch {
      const area = document.createElement('textarea');
      area.value = correo;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy'); } catch { /* sin permiso */ }
      area.remove();
    }
    this.avisos.exito(`Correo copiado: ${correo}`);
  }

  /** Etiqueta con los datos de envío para pegar en la caja, como imagen o como PDF de 15 × 10 cm. */
  descargarEtiqueta(p: PedidoAdmin, formato: 'pdf' | 'imagen'): void {
    const datos = datosDeEtiqueta(p);
    if (formato === 'pdf') descargarEtiquetaPdf(datos);
    else descargarEtiquetaImagen(datos);
  }

  /** Abre el formulario de retraso con las fechas actuales del pedido. */
  abrirRetraso(p: PedidoAdmin): void {
    this.errorRetraso.set('');
    this.retraso.set({ numero: p.number, inicio: p.window.start, fin: p.window.end, motivo: '' });
  }

  cambiarRetraso(campo: 'inicio' | 'fin' | 'motivo', valor: string): void {
    this.retraso.update(r => (r ? { ...r, [campo]: valor } : r));
  }

  /** Guarda la nueva fecha de entrega: Laravel valida, avisa al comprador por correo y devuelve el pedido ya cambiado. */
  guardarRetraso(p: PedidoAdmin): void {
    const r = this.retraso();
    if (!r || r.numero !== p.number) return;
    this.errorRetraso.set('');
    this.trabajando.set(p.number);
    this.servicio.registrarRetraso(p.number, r.inicio, r.fin, r.motivo).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.trabajando.set(null))).subscribe({
      next: nuevo => {
        this.retraso.set(null);
        this.avisos.exito(`Retraso de ${p.number} guardado: se avisó al comprador por correo.`);
        this.reemplazar(nuevo);
      },
      error: (e: ErrorApi) => this.errorRetraso.set(e.errors?.['window_start']?.[0] ?? e.errors?.['window_end']?.[0] ?? e.errors?.['reason']?.[0] ?? e.message),
    });
  }

  /** «Enviado»: exige la guía de Servientrega; el comprador la ve en su seguimiento. */
  enviar(p: PedidoAdmin): void {
    const guia = this.guia().trim();
    if (!guiaValida(guia)) {
      this.errorGuia.set('Escribe la guía de Servientrega (letras, números y guiones, de 5 a 40 caracteres).');
      return;
    }
    this.errorGuia.set('');
    this.trabajando.set(p.number);
    this.servicio.enviado(p.number, guia).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.trabajando.set(null))).subscribe({
      next: nuevo => {
        this.avisos.exito(p.shipped_at ? `Guía de ${p.number} corregida.` : `Pedido ${p.number} marcado como enviado.`);
        this.reemplazar(nuevo);
      },
      error: (e: ErrorApi) => this.errorGuia.set(e.errors?.['tracking_number']?.[0] ?? e.message),
    });
  }

  /** Actualiza el pedido en su lugar; si ya no corresponde al filtro elegido, sale de la lista. */
  private reemplazar(nuevo: PedidoAdmin): void {
    const f = this.filtro();
    const sigue = f === 'all' || f === estadoDePedido(nuevo);   // cada filtro es un estado
    this.pedidos.update(l => sigue ? l.map(x => (x.number === nuevo.number ? nuevo : x)) : l.filter(x => x.number !== nuevo.number));
    if (this.abierto() === nuevo.number && sigue) this.cargarHistorial(nuevo.number);   // la acción acaba de sumar un hecho al historial
  }
}
