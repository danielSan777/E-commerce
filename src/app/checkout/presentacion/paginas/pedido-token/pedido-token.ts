import { Component, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { PedidoPendiente as VistaPendiente } from '../../../dominio/interfaces/pedido_pendiente';
import { PedidoSeguimiento } from '../../../dominio/interfaces/seguimiento';
import { PedidoConsultaService, VistaPedido, esSeguimiento } from '../../../aplicacion/servicios/PedidoConsultaService';
import { PedidoPendienteRecordadoService } from '../../../aplicacion/servicios/PedidoPendienteRecordadoService';
import { etiquetasDeVistaPrevia } from '../../../dominio/validaciones/vista_previa';
import { PedidoPendiente } from '../pedido-pendiente/pedido-pendiente';
import { Seguimiento } from '../seguimiento/seguimiento';
import { NoEncontrada } from '../../../../core/paginas/no-encontrada/no-encontrada';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'pendiente'; vista: VistaPendiente }
  | { tipo: 'seguimiento'; vista: PedidoSeguimiento }
  | { tipo: 'no_encontrado' }
  | { tipo: 'error' };

// /pedido/{token}: Laravel dice si el pedido está pendiente de pago (transferencia) o ya pagado (seguimiento);
// si el token no corresponde a ningún pedido, 404. La página se arma en el servidor (SSR) con las etiquetas
// og:title / og:description / og:image: así WhatsApp muestra la tarjeta con la foto al pegar el enlace. (Pasos 12 y 16)
@Component({
  selector: 'app-pedido-token',
  imports: [PedidoPendiente, Seguimiento, NoEncontrada],
  template: `
    @switch (estado().tipo) {
      @case ('pendiente') {
        <app-pedido-pendiente [vista]="pendiente()!" [token]="token" (actualizada)="mostrar($event)" />
      }
      @case ('seguimiento') {
        <app-seguimiento [pedido]="seguimiento()!" />
      }
      @case ('no_encontrado') {
        <app-no-encontrada />
      }
      @case ('error') {
        <section class="error-carga" role="alert">
          <h1>No pudimos cargar tu pedido</h1>
          <p>Revisa tu conexión e inténtalo de nuevo.</p>
          <button type="button" class="btn btn-primario" (click)="cargar()">Reintentar</button>
        </section>
      }
    }
  `,
  styles: `.error-carga { max-width: 32rem; margin: 3rem auto; padding: 0 1rem; text-align: center; }`,
})
export class PedidoToken {
  private servicio = inject(PedidoConsultaService);
  private meta = inject(Meta);
  private titulo = inject(Title);
  private recordado = inject(PedidoPendienteRecordadoService);

  readonly token = inject(ActivatedRoute).snapshot.paramMap.get('token') ?? '';
  estado = signal<Estado>({ tipo: 'cargando' });

  constructor() {
    // Página privada: no se indexa (Paso 16). Los pixeles no se cargan aquí.
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    this.cargar();
  }

  pendiente(): VistaPendiente | null {
    const e = this.estado();
    return e.tipo === 'pendiente' ? e.vista : null;
  }

  seguimiento(): PedidoSeguimiento | null {
    const e = this.estado();
    return e.tipo === 'seguimiento' ? e.vista : null;
  }

  cargar(): void {
    this.estado.set({ tipo: 'cargando' });
    this.servicio.obtener(this.token).subscribe({
      next: v => this.mostrar(v),
      error: e => {
        if (e?.status === 404) this.recordado.olvidar();
        this.estado.set({ tipo: e?.status === 404 ? 'no_encontrado' : 'error' });
      },
    });
  }

  mostrar(v: VistaPedido): void {
    // Se recuerda para volver a él desde la tienda; vencido o cancelado ya no hay nada que seguir
    const termino = esSeguimiento(v) ? v.visible_status === 'cancelado' || v.visible_status === 'reembolsado' : v.status === 'expired';
    if (termino) this.recordado.olvidar();
    else this.recordado.recordar(v.order_number, this.token);
    if (esSeguimiento(v)) this.estado.set({ tipo: 'seguimiento', vista: v });
    else this.estado.set({ tipo: 'pendiente', vista: v });

    this.titulo.setTitle(v.share.title);
    for (const etiqueta of etiquetasDeVistaPrevia(v.share)) {
      this.meta.updateTag(etiqueta, etiqueta.property ? `property='${etiqueta.property}'` : `name='${etiqueta.name}'`);
    }
  }
}
