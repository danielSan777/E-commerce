import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { PedidosAdminService } from '../../../aplicacion/servicios/PedidosAdminService';
import { EstadoPedidoAdmin, FiltroPedidos, PedidoAdmin, estadoDePedido } from '../../../dominio/interfaces/pedidos-admin';

type Accion = 'pagar' | 'pagar_tarde' | 'cancelar';

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
    { valor: 'pending', etiqueta: 'Por validar' }, { valor: 'paid', etiqueta: 'Pagados' },
    { valor: 'expired', etiqueta: 'Vencidos' }, { valor: 'cancelled', etiqueta: 'Cancelados' }, { valor: 'all', etiqueta: 'Todos' },
  ];
  readonly ETIQUETAS: Record<EstadoPedidoAdmin, string> = { pending: 'Pendiente de pago', paid: 'Pagado', expired: 'Vencido', cancelled: 'Cancelado' };
  readonly fechaHora = fechaHora;
  readonly ventana = ventana;
  readonly estado = estadoDePedido;

  filtro = signal<FiltroPedidos>('pending');
  pedidos = signal<PedidoAdmin[]>([]);
  abierto = signal<string | null>(null);
  cargando = signal(true);
  error = signal('');
  trabajando = signal<string | null>(null);              // número del pedido con una acción en curso
  confirmando = signal<{ numero: string; accion: Accion } | null>(null);
  sobrecupo = signal<{ numero: string; mensaje: string } | null>(null);   // Laravel pidió confirmar que se pasa del límite

  ngOnInit(): void { this.cargar(); }

  elegirFiltro(f: FiltroPedidos): void {
    this.filtro.set(f);
    this.abierto.set(null);
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.servicio.listar(this.filtro()).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false))).subscribe({
      next: p => this.pedidos.set(p),
      error: (e: ErrorApi) => this.error.set(e.message),
    });
  }

  alternar(numero: string): void {
    this.abierto.set(this.abierto() === numero ? null : numero);
    this.confirmando.set(null);
    this.sobrecupo.set(null);
  }

  pedirConfirmacion(numero: string, accion: Accion): void {
    this.sobrecupo.set(null);
    this.confirmando.set({ numero, accion });
  }

  /** Abre el comprobante en otra pestaña. */
  verComprobante(p: PedidoAdmin): void {
    this.trabajando.set(p.number);
    this.servicio.comprobante(p.number).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.trabajando.set(null))).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: (e: ErrorApi) => this.avisos.error(e.message),
    });
  }

  ejecutar(p: PedidoAdmin, accion: Accion, confirmarSobrecupo = false): void {
    this.trabajando.set(p.number);
    const llamada = accion === 'cancelar'
      ? this.servicio.cancelar(p.number)
      : this.servicio.marcarPagado(p.number, { fueraDePlazo: accion === 'pagar_tarde', confirmarSobrecupo });

    llamada.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.trabajando.set(null))).subscribe({
      next: nuevo => {
        this.confirmando.set(null);
        this.sobrecupo.set(null);
        this.avisos.exito(accion === 'cancelar' ? `Pedido ${p.number} cancelado.` : `Pedido ${p.number} marcado como pagado.`);
        // Sale de la lista si ya no corresponde al filtro; si no, se actualiza en su lugar
        const f = this.filtro();
        const sigue = f === 'all' || (f === 'paid' && estadoDePedido(nuevo) === 'paid') || (f === 'cancelled' && estadoDePedido(nuevo) === 'cancelled');
        this.pedidos.update(l => sigue ? l.map(x => (x.number === nuevo.number ? nuevo : x)) : l.filter(x => x.number !== nuevo.number));
      },
      error: (e: ErrorApi) => {
        if (e.code === 'capacity_over_limit') this.sobrecupo.set({ numero: p.number, mensaje: e.message });
        else { this.confirmando.set(null); this.avisos.error(e.message); }
      },
    });
  }
}
