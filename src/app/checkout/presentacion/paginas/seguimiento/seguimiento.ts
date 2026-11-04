import { Component, computed, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { PedidoSeguimiento, EstadoVisible } from '../../../dominio/interfaces/seguimiento';
import { textoVentana } from '../../../dominio/validaciones/fechas';
import { enlaceWhatsapp } from '../../../../core/configuracion/tienda';

// Seguimiento de un pedido pagado (/pedido/{token}). Lee el contrato "Pedido" del Paso 0.
@Component({
  selector: 'app-seguimiento',
  imports: [CurrencyPipe],
  templateUrl: './seguimiento.html',
  styleUrls: ['../pedido-pendiente/pedido-pendiente.css', './seguimiento.css'],
})
export class Seguimiento {
  readonly pedido = input.required<PedidoSeguimiento>();

  // Estados visibles (Paso 15). No existe "Entregado".
  readonly PASOS: { clave: EstadoVisible; etiqueta: string; icono: string }[] = [
    { clave: 'confirmado', etiqueta: 'Confirmado', icono: 'bi-check-circle' },
    { clave: 'en_produccion', etiqueta: 'En producción', icono: 'bi-brush' },
    { clave: 'enviado', etiqueta: 'Enviado', icono: 'bi-truck' },
  ];

  readonly ETIQUETAS: Record<EstadoVisible, string> = {
    confirmado: 'Confirmado',
    en_produccion: 'En producción',
    enviado: 'Enviado',
    cancelado: 'Cancelado',
    reembolsado: 'Reembolsado',
  };

  etiqueta = computed(() => this.ETIQUETAS[this.pedido().visible_status]);
  esFinalNegativo = computed(() => ['cancelado', 'reembolsado'].includes(this.pedido().visible_status));
  indice = computed(() => this.PASOS.findIndex(p => p.clave === this.pedido().visible_status));
  ventana = computed(() => textoVentana(this.pedido().window.start, this.pedido().window.end));

  enlaceAyuda = computed(() =>
    enlaceWhatsapp(`Hola 🌿 Te escribo por mi pedido ${this.pedido().order_number}. Tengo la siguiente consulta:`));
}
