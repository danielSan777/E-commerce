import { Component, PLATFORM_ID, computed, effect, inject, input, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  COLOR_DORADO_PLACA, PLACA_CAJA_ALTO, PLACA_CAJA_ANCHO, PLACA_LINEA_BASE, anchoEstimadoA100, tamanoLetra
} from '../../../personalizador/dominio/placa';

// Vista previa del nombre en la placa: SVG incrustado (no <img> ni canvas), Lobster, centrado con
// text-anchor="middle" y línea base fija. Nunca estira el texto: la caja se escala de forma uniforme.
@Component({
  selector: 'app-texto-placa',
  templateUrl: './texto-placa.html',
  styles: `
    :host { display: block; width: 100%; height: 100%; }
    svg { display: block; width: 100%; height: 100%; }
    text { font-family: 'Lobster', cursive; }
  `,
})
export class TextoPlaca {

  texto = input<string>('');
  color = input<string>(COLOR_DORADO_PLACA);

  readonly ancho = PLACA_CAJA_ANCHO;
  readonly alto = PLACA_CAJA_ALTO;
  readonly base = PLACA_LINEA_BASE;

  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  // Se vuelve true cuando Lobster ya cargó: recién entonces se mide
  private fuenteLista = signal(false);

  private anchoMedido = computed(() => {
    const t = this.texto();
    if (!t) return 0;
    if (!this.esNavegador || !this.fuenteLista()) return anchoEstimadoA100(t);
    return medirA100(t);
  });

  tamano = computed(() => tamanoLetra(this.texto(), this.anchoMedido()));

  constructor() {
    if (this.esNavegador) {
      document.fonts.load('40px Lobster').then(() => this.fuenteLista.set(true), () => this.fuenteLista.set(true));
    }
  }
}

let lienzoMedida: CanvasRenderingContext2D | null = null;

// Mide con un lienzo que no se muestra (solo mide; el texto visible es SVG)
export function medirA100(texto: string): number {
  lienzoMedida ??= document.createElement('canvas').getContext('2d');
  if (!lienzoMedida) return anchoEstimadoA100(texto);
  lienzoMedida.font = "100px Lobster, cursive";
  return lienzoMedida.measureText(texto).width;
}
