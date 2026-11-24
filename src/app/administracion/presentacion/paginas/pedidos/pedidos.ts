import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { PedidosAdminService } from '../../../aplicacion/servicios/PedidosAdminService';
import { descargarEtiquetaImagen, descargarEtiquetaPdf, datosDeEtiqueta } from '../../../aplicacion/servicios/EtiquetaEnvio';
import { EstadoPedidoAdmin, FiltroPedidos, PedidoAdmin, estadoDePedido } from '../../../dominio/interfaces/pedidos-admin';

type Accion = 'pagar' | 'pagar_tarde' | 'cancelar' | 'produccion';

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
    { valor: 'pending', etiqueta: 'Por validar' }, { valor: 'to_produce', etiqueta: 'Por producir' },
    { valor: 'in_production', etiqueta: 'En producción' }, { valor: 'shipped', etiqueta: 'Enviados' },
    { valor: 'expired', etiqueta: 'Vencidos' }, { valor: 'cancelled', etiqueta: 'Cancelados' }, { valor: 'all', etiqueta: 'Todos' },
  ];
  readonly ETIQUETAS: Record<EstadoPedidoAdmin, string> = { pending: 'Pendiente de pago', to_produce: 'Pagado · por producir', in_production: 'En producción', shipped: 'Enviado', expired: 'Vencido', cancelled: 'Cancelado' };
  readonly fechaHora = fechaHora;
  readonly ventana = ventana;
  readonly estado = estadoDePedido;

  filtro = signal<FiltroPedidos>('pending');
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
  guia = signal('');                                       // guía escrita para marcar «Enviado»
  errorGuia = signal('');
  sobrecupo = signal<{ numero: string; mensaje: string } | null>(null);   // Laravel pidió confirmar que se pasa del límite

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => clearTimeout(this.espera));
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

  elegirFiltro(f: FiltroPedidos): void {
    this.filtro.set(f);
    this.abierto.set(null);
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.servicio.listar(this.filtro(), this.busqueda()).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false))).subscribe({
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
  }

  pedirConfirmacion(numero: string, accion: Accion): void {
    this.sobrecupo.set(null);
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
    const llamada = accion === 'cancelar' ? this.servicio.cancelar(p.number, { notificar: this.notificarCancelacion(), motivo: this.motivoCancelacion() })
      : accion === 'produccion' ? this.servicio.enProduccion(p.number)
      : this.servicio.marcarPagado(p.number, { fueraDePlazo: accion === 'pagar_tarde', confirmarSobrecupo });

    llamada.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.trabajando.set(null))).subscribe({
      next: nuevo => {
        this.confirmando.set(null);
        this.sobrecupo.set(null);
        this.notificarCancelacion.set(false);
        this.motivoCancelacion.set('');
        this.avisos.exito(accion === 'cancelar' ? `Pedido ${p.number} cancelado.` : accion === 'produccion' ? `Pedido ${p.number} en producción.` : `Pedido ${p.number} marcado como pagado.`);
        this.reemplazar(nuevo);
      },
      error: (e: ErrorApi) => {
        if (e.code === 'capacity_over_limit') this.sobrecupo.set({ numero: p.number, mensaje: e.message });
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
    const datos = datosDeEtiqueta(p, ventana(p.window));
    if (formato === 'pdf') descargarEtiquetaPdf(datos);
    else descargarEtiquetaImagen(datos);
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
  }
}
