import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PedidoService } from '../../../aplicacion/servicios/PedidoService';
import { CUENTAS, ENTREGA_ESTIMADA, TITULAR_TRANSFERENCIA } from '../../../dominio/interfaces/datos_transferencia';
import {
  fechaLarga, mensajeCompleto, mensajeCorto, urlWhatsapp
} from '../../../dominio/validaciones/mensaje_whatsapp';

@Component({
  selector: 'app-confirmacion',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './confirmacion.html',
  styleUrl: './confirmacion.css',
})
export class Confirmacion {

  // ===== EDITABLES =====
  readonly RUTA_SEGUIR = '/catalogo/todos-productos';   // "Seguir comprando"
  readonly ENTREGA = ENTREGA_ESTIMADA;                  // el texto se cambia en dominio/datos-transferencia.ts
  readonly TITULAR = TITULAR_TRANSFERENCIA;
  readonly CUENTAS = CUENTAS;

  private pedidos = inject(PedidoService);

  pedido = this.pedidos.pedido;

  // Hasta leer el pedido guardado no se sabe si existe (así no se muestra "sin pedido" por un instante)
  cargado = signal(false);

  esTransferencia = computed(() => this.pedido()?.metodo === 'transferencia');
  fecha = computed(() => (this.pedido() ? fechaLarga(this.pedido()!.fecha) : ''));
  mensaje = computed(() => (this.pedido() ? mensajeCorto(this.pedido()!) : ''));
  enlaceWhatsapp = computed(() => (this.pedido() ? urlWhatsapp(this.pedido()!) : ''));

  // Qué se acaba de copiar (para mostrar ✓ un momento)
  copiado = signal('');

  constructor() {
    afterNextRender(() => {
      this.pedidos.restaurar();
      this.cargado.set(true);
    });
  }

  // El botón de copiar del mensaje copia el mensaje completo, el mismo que se manda por WhatsApp
  async copiar(clave: string, texto: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // Navegadores sin permiso para el portapapeles: se usa el método antiguo
      const area = document.createElement('textarea');
      area.value = texto;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy'); } catch { /* sin permiso */ }
      area.remove();
    }

    this.copiado.set(clave);
    setTimeout(() => { if (this.copiado() === clave) this.copiado.set(''); }, 1800);
  }

  copiarMensaje(): void {
    const p = this.pedido();
    if (p) this.copiar('mensaje', mensajeCompleto(p));
  }

  // Si la foto del producto no existe, se oculta y queda el fondo
  sinImagen(evento: Event): void {
    (evento.target as HTMLImageElement).style.visibility = 'hidden';
  }
}