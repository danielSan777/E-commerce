import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, tap } from 'rxjs';
import { CurrencyPipe, LowerCasePipe } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CampanaContrato } from '../../../dominio/interfaces/campana';
import { CampanaService } from '../../../aplicacion/servicios/CampanaService';
import { PromesaService } from '../../../../checkout/aplicacion/servicios/PromesaService';
import { EnvioGratisService } from '../../../../catalogo/aplicacion/servicios/EnvioGratisService';
import { ComoFunciona } from '../../../../shared/componentes/como-funciona/como-funciona';
import { NoEncontrada } from '../../../../core/paginas/no-encontrada/no-encontrada';
import { VideoAuto } from '../../../../shared/directivas/video-auto';

// Plantilla de campañas de temporada (/san-valentin, /navidad…), cada una con su color, emoji y portada. En temporada muestra los productos elegidos y la fecha límite;
// fuera de temporada la URL sigue respondiendo con "llegará muy pronto" (Paso 6).
@Component({
  selector: 'app-campana',
  imports: [CurrencyPipe, LowerCasePipe, RouterLink, ComoFunciona, NoEncontrada, VideoAuto],
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
    of(this.route.snapshot.paramMap?.get('campana') ?? this.route.snapshot.data['campana'] ?? '').pipe(
      tap(() => this.fallo.set(false)),
      switchMap(slug => this.servicio.campana(slug).pipe(catchError(() => { this.fallo.set(true); return of(null); }))),
    ),
    { initialValue: undefined },
  );
  enTemporada = computed(() => this.campana()?.state === 'active');

  // Diseño propio de la campaña: el color reemplaza al vino/rosa de siempre (solo si es un #RRGGBB válido).
  color = computed(() => { const c = this.campana()?.theme.color; return c && /^#[0-9a-f]{6}$/i.test(c) ? c : null; });
  tinte = computed(() => { const c = this.color(); return c ? `color-mix(in srgb, ${c} 14%, white)` : null; });
  /** srcset de la portada: "url 600w, url 1080w". */
  portadaSrcset = computed(() => {
    const cover = this.campana()?.theme.cover;
    return cover ? Object.entries(cover.srcset).map(([ancho, url]) => `${url} ${ancho}w`).join(', ') : null;
  });
  portadaUrl = computed(() => { const s = this.campana()?.theme.cover?.srcset; return s ? (s['1080'] ?? Object.values(s)[0] ?? null) : null; });

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
