import { Component, computed, input } from '@angular/core';
import { AccesorioColocado } from '../../../personalizador/dominio/Accesorios';
import { TextoPlaca } from '../texto-placa/texto-placa';

/** Lo necesario para volver a pintar la maceta personalizada tal como se vio en el personalizador (se guarda en el carrito). */
export interface EscenaMaceta {
  imagenBase: string;
  ajuste: { escala: number; x: number; y: number };
  /** Accesorios ya ordenados de atrás hacia adelante (por la capa de su ubicación). */
  accesorios: AccesorioColocado[];
  nombre: string;
  colorTexto: string;
  /** Color (hexadecimal) de los lentes y gafas, por id de accesorio. */
  tintes: Record<number, string>;
}

let contador = 0;

/**
 * La maceta con sus accesorios en sus ubicaciones, pintada con las mismas fotos y medidas (en %) del visor del personalizador.
 * No dibuja en canvas ni descarga nada nuevo: usa las mismas fotos que el navegador ya tiene, y no depende de CORS.
 */
@Component({
  selector: 'app-vista-maceta',
  imports: [TextoPlaca],
  templateUrl: './vista-maceta.html',
  styleUrl: './vista-maceta.css',
})
export class VistaMaceta {
  escena = input.required<EscenaMaceta>();
  alt = input('');

  private readonly id = `tinte-${++contador}`;

  /** Un filtro SVG por color: pinta de plano lo que no es transparente (igual que "source-atop" en el canvas). */
  colores = computed(() => [...new Set(Object.values(this.escena().tintes))].map(hex => ({ hex, id: `${this.id}-${hex.replace('#', '')}` })));

  filtroDe(accesorioId: number): string | null {
    const hex = this.escena().tintes[accesorioId];
    return hex ? `url(#${this.id}-${hex.replace('#', '')})` : null;
  }

  transformBase = computed(() => {
    const a = this.escena().ajuste;
    return `translate(${a.x}%, ${a.y}%) scale(${a.escala / 100})`;
  });

  transformar(a: AccesorioColocado): string {
    const espejo = a.espejo ? ' scaleX(-1)' : '';
    return `perspective(600px) rotateX(${a.rotX ?? 0}deg) rotateY(${a.rotY ?? 0}deg) rotateZ(${a.rotZ ?? 0}deg)${espejo}`;
  }
}
