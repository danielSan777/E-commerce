import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PoliticaService } from '../../../aplicacion/servicios/PoliticaService';
import { NoEncontrada } from '../../../../core/paginas/no-encontrada/no-encontrada';
import { TIENDA, enlaceWhatsapp } from '../../../../core/configuracion/tienda';

// Plantilla única de políticas: /politicas-privacidad, /terminos-y-condiciones, /politicas-de-envio y
// /cambios-de-productos-personalizados. Muestra título, versión, fecha y el texto que entregue Laravel.
@Component({
  selector: 'app-politica',
  imports: [DatePipe, RouterLink, NoEncontrada],
  templateUrl: './politica.html',
  styleUrl: './politica.css',
})
export class Politica {
  private servicio = inject(PoliticaService);
  private slug = inject(ActivatedRoute).snapshot.data['politica'] ?? '';

  politica = computed(() => this.servicio.politica(this.slug));
  readonly otras = computed(() => this.servicio.todas().filter(p => p.slug !== this.slug));
  readonly whatsapp = enlaceWhatsapp();
  readonly correoTienda = TIENDA.correo;

  constructor() {
    const p = this.politica();
    if (!p) return;
    inject(Title).setTitle(`${p.title} | Jardín de Sele`);
    // Mientras no exista el texto aprobado, la página no se indexa
    inject(Meta).updateTag({ name: 'robots', content: p.paragraphs.length ? 'index, follow' : 'noindex, follow' });
  }
}
