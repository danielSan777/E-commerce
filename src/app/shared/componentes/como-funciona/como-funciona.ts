import { Component } from '@angular/core';

// Bloque "¿Cómo funciona?" con los 3 pasos y la fila de confianza. Lo usan /categorias y las temporadas.
@Component({
  selector: 'app-como-funciona',
  templateUrl: './como-funciona.html',
  styleUrl: './como-funciona.css',
})
export class ComoFunciona {
  readonly PASOS = [
    { icono: 'bi-grid', texto: 'Elige una categoría' },
    { icono: 'bi-pencil', texto: 'Personaliza tu maceta' },
    { icono: 'bi-box-seam', texto: 'Recíbela en casa' },
  ];
  readonly CONFIANZA = [
    { icono: 'bi-geo-alt', texto: 'Hecho en Guayaquil' },
    { icono: 'bi-truck', texto: 'Envíos por Servientrega' },
    { icono: 'bi-shield-check', texto: 'Pago seguro' },
  ];
}
