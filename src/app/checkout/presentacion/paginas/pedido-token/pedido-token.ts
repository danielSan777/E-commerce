import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { PedidoService } from '../../../aplicacion/servicios/PedidoService';
import { SeguimientoService } from '../../../aplicacion/servicios/SeguimientoService';
import { PedidoPendiente } from '../pedido-pendiente/pedido-pendiente';
import { Seguimiento } from '../seguimiento/seguimiento';
import { NoEncontrada } from '../../../../core/paginas/no-encontrada/no-encontrada';

// /pedido/{token}: si el pedido está pagado muestra el seguimiento; si es una transferencia pendiente, la vista de
// pedido pendiente; si el token no corresponde a ningún pedido, el 404. (Paso 16)
@Component({
  selector: 'app-pedido-token',
  imports: [PedidoPendiente, Seguimiento, NoEncontrada],
  template: `
    @if (cargado()) {
      @if (seguimiento(); as s) {
        <app-seguimiento [pedido]="s" />
      } @else if (pendiente()) {
        <app-pedido-pendiente />
      } @else {
        <app-no-encontrada />
      }
    }
  `,
})
export class PedidoToken {
  private route = inject(ActivatedRoute);
  private pedidos = inject(PedidoService);
  private servicio = inject(SeguimientoService);

  cargado = signal(false);
  private token = this.route.snapshot.paramMap.get('token') ?? '';

  private coincide = computed(() => {
    const p = this.pedidos.pedido();
    return p && p.token === this.token ? p : null;
  });

  seguimiento = computed(() => {
    const p = this.coincide();
    return p?.pagoConfirmado ? this.servicio.desdePedido(p) : null;
  });

  pendiente = computed(() => {
    const p = this.coincide();
    return !!p && !p.pagoConfirmado && p.metodo === 'transferencia';
  });

  constructor() {
    // Página privada: no se indexa (Paso 16). Los pixeles no se cargan aquí.
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });

    afterNextRender(() => {
      this.pedidos.restaurar();
      this.cargado.set(true);
    });
  }
}
