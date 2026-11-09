import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ConsultaPedidoService } from '../../../aplicacion/servicios/ConsultaPedidoService';
import { TIENDA, enlaceWhatsapp } from '../../../../core/configuracion/tienda';

// "Consultar mi pedido": número de pedido + correo. No muestra datos en pantalla; el enlace privado llega al correo.
@Component({
  selector: 'app-consultar-pedido',
  imports: [FormsModule, RouterLink],
  templateUrl: './consultar-pedido.html',
  styleUrl: './consultar-pedido.css',
})
export class ConsultarPedido {
  private servicio = inject(ConsultaPedidoService);
  private destroyRef = inject(DestroyRef);

  numero = '';
  correo = '';
  enviando = signal(false);
  respuesta = signal('');
  error = signal('');
  readonly whatsapp = enlaceWhatsapp();
  readonly correoTienda = TIENDA.correo;

  constructor() {
    inject(Title).setTitle('Consultar mi pedido | Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, follow' });
  }

  enviar(evento: Event): void {
    evento.preventDefault();
    this.respuesta.set('');
    const numero = this.numero.trim();
    const correo = this.correo.trim();
    if (!numero) return this.error.set('Escribe tu número de pedido.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return this.error.set('Escribe un correo válido.');

    this.error.set('');
    this.enviando.set(true);
    this.servicio.reenviarEnlace(numero, correo).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.enviando.set(false)),
    ).subscribe({
      next: r => this.respuesta.set(r.message),
      error: () => this.error.set('No pudimos enviar la solicitud. Inténtalo de nuevo en unos minutos.'),
    });
  }
}
