import { Component, DestroyRef, afterNextRender, computed, effect, inject, signal, untracked } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { PedidoPendienteRecordadoService } from '../../../aplicacion/servicios/PedidoPendienteRecordadoService';
import { PedidoConsultaService, esSeguimiento } from '../../../aplicacion/servicios/PedidoConsultaService';

// Aviso con el estado de tu último pedido, para volver a /pedido/{token} (subir comprobante, ver la guía de envío…).
// El estado lo dice Laravel; si el pedido venció, se canceló o no existe, el aviso desaparece.
@Component({
  selector: 'app-aviso-pedido-pendiente',
  imports: [RouterLink],
  template: `
    @if (visible() && recordado.pedido(); as p) {
      @if (estado(); as texto) {
        <div class="aviso-pedido" role="status">
          <i class="bi" [class]="icono()" aria-hidden="true"></i>
          <span>Pedido <b>{{ p.numero }}</b>: {{ texto }}</span>
          <a class="aviso-enlace" [routerLink]="['/pedido', p.token]">Ver mi pedido</a>
        </div>
      }
    }
  `,
  styles: `
    .aviso-pedido { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 0.5rem 0.75rem;
      padding: 0.55rem 1rem; background: #fff6df; border-bottom: 1px solid #f1d98f; color: #5b4300; font-size: 0.9rem; }
    .aviso-enlace { padding: 0.25rem 0.8rem; border-radius: 999px; background: #2f6b4f; color: #fff; font-weight: 600; text-decoration: none; }
    .aviso-enlace:focus-visible { outline: 3px solid #1b4332; outline-offset: 2px; }
  `,
})
export class AvisoPedidoPendiente {
  // EDITABLE: pantallas donde no tiene sentido mostrarlo (ya está en el pedido o en la confirmación)
  readonly OCULTO_EN = ['/pedido/', '/checkout/confirmacion'];

  readonly recordado = inject(PedidoPendienteRecordadoService);
  private consulta = inject(PedidoConsultaService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  private url = toSignal(
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), map(() => this.router.url)),
    { initialValue: this.router.url },
  );
  visible = computed(() => !this.OCULTO_EN.some(r => this.url().startsWith(r)));

  // Texto según el estado que devolvió Laravel; vacío mientras no se sabe (así no parpadea un dato viejo)
  estado = signal('');
  icono = signal('bi-clock-history');

  constructor() {
    afterNextRender(() => this.recordado.restaurar());

    // Cada vez que cambia el pedido recordado, se pregunta su estado a Laravel
    effect(() => {
      const p = this.recordado.pedido();
      untracked(() => {
        this.estado.set('');
        if (!p) return;
        this.consulta.obtener(p.token).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: v => {
            if (esSeguimiento(v)) {
              if (v.visible_status === 'cancelado' || v.visible_status === 'reembolsado') { this.recordado.olvidar(); return; }
              const textos = { confirmado: 'pago confirmado', en_produccion: 'en producción', enviado: 'enviado' } as const;
              this.icono.set(v.visible_status === 'enviado' ? 'bi-truck' : v.visible_status === 'en_produccion' ? 'bi-brush' : 'bi-check-circle');
              this.estado.set(textos[v.visible_status as keyof typeof textos] ?? 'en curso');
            } else if (v.status === 'expired') {
              this.recordado.olvidar();
            } else {
              this.icono.set('bi-clock-history');
              this.estado.set(v.receipt.uploaded ? 'comprobante en revisión' : 'pendiente de pago');
            }
          },
          error: e => { if (e?.status === 404) this.recordado.olvidar(); },
        });
      });
    });
  }
}
