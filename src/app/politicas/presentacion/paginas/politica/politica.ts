import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { PoliticaService } from '../../../aplicacion/servicios/PoliticaService';

// /terminos-y-condiciones: una sola página con todo el texto legal (envíos, cambios, cancelaciones y datos incluidos).
@Component({
  selector: 'app-politica',
  imports: [DatePipe],
  templateUrl: './politica.html',
  styleUrl: './politica.css',
})
export class Politica {
  readonly terminos = inject(PoliticaService).terminos();

  constructor() {
    inject(Title).setTitle(`${this.terminos.title}`);
    inject(Meta).updateTag({ name: 'robots', content: 'index, follow' });
  }

  // Parte un texto con **negrita** en trozos para dibujarlo sin HTML inyectado
  trozos(texto: string): { texto: string; negrita: boolean }[] {
    return texto.split('**').map((t, i) => ({ texto: t, negrita: i % 2 === 1 })).filter(t => t.texto);
  }
}
