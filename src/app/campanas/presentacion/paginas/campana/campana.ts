import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CampanaService } from '../../../aplicacion/servicios/CampanaService';
import { PromesaService } from '../../../../checkout/aplicacion/servicios/PromesaService';
import { EnvioGratisService } from '../../../../catalogo/aplicacion/servicios/EnvioGratisService';
import { ComoFunciona } from '../../../../shared/componentes/como-funciona/como-funciona';
import { NoEncontrada } from '../../../../core/paginas/no-encontrada/no-encontrada';

// Plantilla de campañas de temporada (/san-valentin). En temporada muestra los productos elegidos y la fecha límite;
// fuera de temporada la URL sigue respondiendo con "llegará muy pronto" (Paso 6).
@Component({
  selector: 'app-campana',
  imports: [CurrencyPipe, RouterLink, ComoFunciona, NoEncontrada],
  templateUrl: './campana.html',
  styleUrl: './campana.css',
})
export class Campana {
  private route = inject(ActivatedRoute);
  private servicio = inject(CampanaService);

  readonly promesa = inject(PromesaService).promesa();
  readonly macetasEnvioGratis = inject(EnvioGratisService).MACETAS_PARA_ENVIO_GRATIS;

  // La campaña viene en los datos de la ruta (/san-valentin)
  campana = computed(() => this.servicio.campana(this.route.snapshot.data['campana'] ?? ''));
  enTemporada = computed(() => this.campana()?.state === 'active');

  constructor() {
    const c = this.campana();
    if (!c) return;
    inject(Title).setTitle(c.seo.title);
    const meta = inject(Meta);
    meta.updateTag({ name: 'description', content: c.seo.description });
    meta.updateTag({ property: 'og:title', content: c.seo.title });
    meta.updateTag({ property: 'og:image', content: c.seo.og_image });
  }
}
