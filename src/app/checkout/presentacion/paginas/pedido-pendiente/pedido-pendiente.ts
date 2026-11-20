import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PedidoPendiente as VistaPendiente } from '../../../dominio/interfaces/pedido_pendiente';
import { PedidoConsultaService, VistaPedido } from '../../../aplicacion/servicios/PedidoConsultaService';
import { enlaceWhatsapp } from '../../../../core/configuracion/tienda';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';

// Pedido pendiente de pago por transferencia (/pedido/{token}). Lee el contrato "Pedido pendiente de pago" del Paso 0.
// Laravel entrega el plazo, las cuentas y el estado; aquí solo se muestran y se sube el comprobante.
@Component({
  selector: 'app-pedido-pendiente',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './pedido-pendiente.html',
  styleUrl: './pedido-pendiente.css',
})
export class PedidoPendiente {

  // ===== EDITABLES =====
  readonly RUTA_COMPRAR = '/categorias';
  readonly TIPOS_COMPROBANTE = ['image/jpeg', 'image/png', 'application/pdf'];   // JPG, PNG o PDF
  readonly MAX_COMPROBANTE_MB = 5;                                                // Laravel también lo valida

  private servicio = inject(PedidoConsultaService);
  private avisos = inject(AvisosService);

  readonly vista = input.required<VistaPendiente>();
  readonly token = input.required<string>();
  /** Laravel devolvió el pedido actualizado (por ejemplo, con el comprobante recibido). */
  readonly actualizada = output<VistaPedido>();

  vencido = computed(() => this.vista().status === 'expired');

  subiendo = signal(false);
  errorArchivo = signal('');
  copiado = signal('');

  // Ayuda por WhatsApp (mensaje prellenado del Paso 1)
  enlaceAyuda = computed(() =>
    enlaceWhatsapp(`Hola 🌿 Te escribo por mi pedido ${this.vista().order_number}. Tengo la siguiente consulta:`));

  elegirComprobante(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const archivo = campo.files?.[0];
    if (!archivo) return;
    campo.value = '';

    if (!this.TIPOS_COMPROBANTE.includes(archivo.type)) {
      this.errorArchivo.set('El comprobante debe ser una imagen JPG o PNG, o un PDF.');
      return;
    }
    if (archivo.size > this.MAX_COMPROBANTE_MB * 1024 * 1024) {
      this.errorArchivo.set(`El comprobante no puede pesar más de ${this.MAX_COMPROBANTE_MB} MB.`);
      return;
    }

    this.errorArchivo.set('');
    this.subiendo.set(true);
    this.servicio.subirComprobante(this.token(), archivo).subscribe({
      next: v => {
        this.subiendo.set(false);
        this.avisos.exito('Recibimos tu comprobante.');
        this.actualizada.emit(v);
      },
      error: e => {
        this.subiendo.set(false);
        this.errorArchivo.set(e?.errors?.receipt?.[0] ?? e?.message ?? 'No pudimos subir el comprobante. Inténtalo de nuevo.');
      },
    });
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
