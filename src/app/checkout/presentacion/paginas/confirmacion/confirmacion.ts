import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PedidoService } from '../../../aplicacion/servicios/PedidoService';
import { distintivoBanco } from '../../../dominio/interfaces/datos_transferencia';
import { itemsConFoto, nombreArchivoFoto } from '../../../dominio/validaciones/foto_pedido';
import { fechaLarga } from '../../../dominio/validaciones/mensaje_whatsapp';

@Component({
  selector: 'app-confirmacion',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './confirmacion.html',
  styleUrl: './confirmacion.css',
})
export class Confirmacion {

  // ===== EDITABLES =====
  readonly RUTA_SEGUIR = '/categorias';   // "Seguir comprando"

  private pedidos = inject(PedidoService);

  pedido = this.pedidos.pedido;

  // Hasta leer el pedido guardado no se sabe si existe (así no se muestra "sin pedido" por un instante)
  cargado = signal(false);

  esTransferencia = computed(() => this.pedido()?.metodo === 'transferencia');
  fecha = computed(() => (this.pedido() ? fechaLarga(this.pedido()!.fecha) : ''));
  // Todo lo de la transferencia (plazo, cuentas, mensaje y enlace de WhatsApp) lo entregó Laravel al crear el pedido
  pendiente = computed(() => this.pedido()?.pendiente ?? null);
  limite = computed(() => this.pendiente()?.deadline_label ?? '');
  mensaje = computed(() => this.pendiente()?.whatsapp_message ?? '');
  enlaceWhatsapp = computed(() => this.pendiente()?.whatsapp_url ?? '');
  titular = computed(() => this.pendiente()?.bank_accounts[0] ?? null);
  cuentas = computed(() => (this.pendiente()?.bank_accounts ?? []).map(c => ({ ...c, ...distintivoBanco(c.bank) })));

  // Fotos de las macetas personalizadas: se descargan para adjuntarlas en el chat de WhatsApp (el enlace solo lleva texto)
  fotos = computed(() => {
    const p = this.pedido();
    return p ? itemsConFoto(p.items).map((item, i) => ({ item, nombre: nombreArchivoFoto(p.numero, item, i + 1) })) : [];
  });

  // Qué se acaba de copiar (para mostrar ✓ un momento)
  copiado = signal('');

  constructor() {
    afterNextRender(() => {
      this.pedidos.restaurar();
      this.cargado.set(true);
    });
  }

  // El botón de copiar del mensaje copia el mismo mensaje que se manda por WhatsApp
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
    const texto = this.mensaje();
    if (texto) this.copiar('mensaje', texto);
  }

  // Si la foto del producto no existe, se oculta y queda el fondo
  sinImagen(evento: Event): void {
    (evento.target as HTMLImageElement).style.visibility = 'hidden';
  }
}