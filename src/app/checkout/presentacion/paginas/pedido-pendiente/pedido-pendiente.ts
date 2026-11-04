import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PedidoService } from '../../../aplicacion/servicios/PedidoService';
import { PedidoPendienteService } from '../../../aplicacion/servicios/PedidoPendienteService';
import { enlaceWhatsapp } from '../../../../core/configuracion/tienda';
import { NoEncontrada } from '../../../../core/paginas/no-encontrada/no-encontrada';

// Pedido pendiente de pago por transferencia (/pedido/{token}). Lee el contrato "Pedido pendiente de pago" del Paso 0.
@Component({
  selector: 'app-pedido-pendiente',
  imports: [CurrencyPipe, RouterLink, NoEncontrada],
  templateUrl: './pedido-pendiente.html',
  styleUrl: './pedido-pendiente.css',
})
export class PedidoPendiente {

  // ===== EDITABLES =====
  readonly RUTA_COMPRAR = '/categorias';
  readonly TIPOS_COMPROBANTE = ['image/jpeg', 'image/png', 'application/pdf'];   // JPG, PNG o PDF

  private route = inject(ActivatedRoute);
  private pedidos = inject(PedidoService);
  private servicio = inject(PedidoPendienteService);

  // Hasta leer el pedido guardado no se sabe si existe
  cargado = signal(false);

  private token = this.route.snapshot.paramMap.get('token') ?? '';

  // Solo se muestra si el token es el del pedido por transferencia que está guardado
  pedido = computed(() => {
    const p = this.pedidos.pedido();
    return p && p.token === this.token && p.metodo === 'transferencia' ? p : null;
  });

  vista = computed(() => (this.pedido() ? this.servicio.desdePedido(this.pedido()!) : null));
  vencido = computed(() => this.vista()?.status === 'expired');
  comprobante = computed(() => this.pedido()?.comprobante ?? null);

  errorArchivo = signal('');
  copiado = signal('');

  // Ayuda por WhatsApp (mensaje prellenado del Paso 1)
  enlaceAyuda = computed(() => {
    const p = this.pedido();
    if (!p) return '';
    const texto = `Hola 🌿 Te escribo por mi pedido ${p.numero}. Tengo la siguiente consulta:`;
    return enlaceWhatsapp(texto);
  });

  constructor() {
    afterNextRender(() => {
      this.pedidos.restaurar();
      this.cargado.set(true);
    });
  }

  elegirComprobante(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const archivo = campo.files?.[0];
    if (!archivo) return;

    if (!this.TIPOS_COMPROBANTE.includes(archivo.type)) {
      this.errorArchivo.set('El comprobante debe ser una imagen JPG o PNG, o un PDF.');
      campo.value = '';
      return;
    }

    this.errorArchivo.set('');
    this.pedidos.adjuntarComprobante(archivo.name);
    campo.value = '';
  }

  async copiar(clave: string, texto: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
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
}
