import { Component, afterNextRender, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { PedidoPendienteRecordadoService } from '../../../aplicacion/servicios/PedidoPendienteRecordadoService';

// Aviso "Tienes un pedido pendiente de pago" para volver a /pedido/{token} (subir comprobante o enviarlo por WhatsApp).
@Component({
  selector: 'app-aviso-pedido-pendiente',
  imports: [RouterLink],
  template: `
    @if (visible() && recordado.pedido(); as p) {
      <div class="aviso-pedido" role="status">
        <i class="bi bi-clock-history" aria-hidden="true"></i>
        <span>Tienes un pedido pendiente de pago: <b>{{ p.numero }}</b></span>
        <a class="aviso-enlace" [routerLink]="['/pedido', p.token]">Ver mi pedido</a>
      </div>
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
  private router = inject(Router);

  private url = toSignal(
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), map(() => this.router.url)),
    { initialValue: this.router.url },
  );
  visible = computed(() => !this.OCULTO_EN.some(r => this.url().startsWith(r)));

  constructor() {
    afterNextRender(() => this.recordado.restaurar());
  }
}
