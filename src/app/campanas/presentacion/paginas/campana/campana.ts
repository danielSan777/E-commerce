import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, tap } from 'rxjs';
import { CurrencyPipe } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CampanaContrato } from '../../../dominio/interfaces/campana';
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

  private titulo = inject(Title);
  private meta = inject(Meta);

  /** true si la API no respondió (distinto de "no existe": eso es un 404). */
  readonly fallo = signal(false);

  // La campaña viene en los datos de la ruta (/san-valentin).
  // undefined = cargando · null = no existe · contrato = lo que Laravel entregó.
  campana = toSignal<CampanaContrato | null | undefined>(
    of(this.route.snapshot.data['campana'] ?? '').pipe(
      tap(() => this.fallo.set(false)),
      switchMap(slug => this.servicio.campana(slug).pipe(catchError(() => { this.fallo.set(true); return of(null); }))),
    ),
    { initialValue: undefined },
  );
  enTemporada = computed(() => this.campana()?.state === 'active');

  constructor() {
    effect(() => {
      const c = this.campana();
      if (!c) return;
      this.titulo.setTitle(c.seo.title);
      this.meta.updateTag({ name: 'description', content: c.seo.description });
      this.meta.updateTag({ property: 'og:title', content: c.seo.title });
      this.meta.updateTag({ property: 'og:image', content: c.seo.og_image });
    });
  }
}
