import { Component, DOCUMENT, afterNextRender, computed, effect, inject, Injector, signal } from '@angular/core';
import { VideoAuto } from '../../../../shared/directivas/video-auto';
import { CurrencyPipe } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, tap } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CategoriaContrato } from '../../../dominio/interfaces/categoria';
import { CategoriaService } from '../../../aplicacion/servicios/CategoriaService';
import { PromesaService } from '../../../../checkout/aplicacion/servicios/PromesaService';
import { NoEncontrada } from '../../../../core/paginas/no-encontrada/no-encontrada';

// Pantalla de categorías. Una sola plantilla para /categorias, /{categoria} y /{categoria}/{subcategoria}:
// cada estado tiene su URL, y cambiar de categoría o de pestaña solo cambia la URL (no recarga la página).
@Component({
  selector: 'app-categorias',
  imports: [CurrencyPipe, RouterLink, NoEncontrada, VideoAuto],
  templateUrl: './categorias.html',
  styleUrl: './categorias.css',
})
export class Categorias {
  private route = inject(ActivatedRoute);
  private injector = inject(Injector);
  private servicio = inject(CategoriaService);
  private document = inject(DOCUMENT);
  private titulo = inject(Title);
  private meta = inject(Meta);

  // La categoría viene en los datos de la ruta (/amor) y la subcategoría en el parámetro (/profesiones-y-hobbies/salud)
  private datos = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  private parametros = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });

  readonly tarjetas = toSignal(this.servicio.categorias().pipe(catchError(() => of([]))), { initialValue: [] });
  readonly promesa = inject(PromesaService).promesa();

  /** true si la API no respondió (distinto de "no existe": eso es un 404). */
  readonly fallo = signal(false);
  /** Banner con varios videos: se muestran uno tras otro, al terminar cada uno pasa al siguiente. */
  readonly videoIdx = signal(0);
  readonly videosBanner = computed(() => this.categoria()?.videos ?? (this.categoria()?.video ? [this.categoria()!.video!] : []));
  readonly videoBanner = computed(() => { const l = this.videosBanner(); return l.length ? l[this.videoIdx() % l.length] : null; });
  siguienteVideo(): void { this.videoIdx.update(i => (i + 1) % Math.max(this.videosBanner().length, 1)); }

  /** undefined = cargando · null = no existe (404) · contrato = lo que Laravel entregó. */
  categoria = toSignal<CategoriaContrato | null | undefined, CategoriaContrato | null | undefined>(
    toObservable(computed(() => [this.datos()['categoria'] ?? this.parametros().get('categoria'), this.parametros().get('subcategoria')] as const)).pipe(
      tap(() => this.fallo.set(false)),
      switchMap(([categoria, subcategoria]) => this.servicio.categoria(categoria, subcategoria).pipe(
        catchError(() => { this.fallo.set(true); return of(null); }),
      )),
    ),
    // Si la categoría ya se descargó (precarga o visita anterior), se muestra en el primer pintado, sin pasar por "Cargando…"
    { initialValue: this.servicio.enCache(this.route.snapshot.data['categoria'] ?? this.route.snapshot.paramMap.get('categoria'), this.route.snapshot.paramMap.get('subcategoria')) },
  );

  // Flechas de las pestañas: avisan que hay más subcategorías hacia los lados
  readonly flechaIzq = signal(false);
  readonly flechaDer = signal(false);

  revisarFlechas(nav: Element | null): void {
    if (!nav) return;
    this.flechaIzq.set(nav.scrollLeft > 4);
    this.flechaDer.set(nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 4);
  }

  mover(nav: HTMLElement, sentido: 1 | -1): void {
    nav.scrollBy({ left: sentido * nav.clientWidth * 0.6, behavior: 'smooth' });
  }

  // Ruta del botón "Todos" de las pestañas
  rutaTodos = computed(() => `/${this.categoria()?.slug}`);

  // Pestaña activa (nombre, ícono y texto bajo el título) y otras categorías para seguir explorando
  subcategoria = computed(() => {
    const c = this.categoria();
    return c?.subcategories.find(s => s.slug === c.active_subcategory);
  });
  otras = computed(() => this.tarjetas().filter(t => t.slug !== this.categoria()?.slug));

  // "Ver más de Salud": al inicio se ven los primeros productos; todos están en el HTML (los demás, ocultos)
  readonly PRODUCTOS_INICIALES = 4;
  verTodos = signal(false);
  visible(indice: number): boolean {
    return this.verTodos() || indice < this.PRODUCTOS_INICIALES;
  }

  constructor() {
    afterNextRender(() => setTimeout(() => this.revisarFlechas(this.document.querySelector('nav.pestanas'))));
    // SEO por estado: título, descripción, imagen para compartir y canonical (sin UTMs)
    // Con la categoría ya en pantalla, adelanta las demás subcategorías en segundo plano (solo en el navegador)
    afterNextRender(() => {
      effect(() => {
        const c = this.categoria();
        if (c?.slug && c.subcategories.length) this.servicio.adelantar(c.slug, c.subcategories.map(s => s.slug));
      }, { injector: this.injector });
    });

    effect(() => {
      const c = this.categoria();
      if (!c) return;
      this.titulo.setTitle(c.seo.title);
      this.meta.updateTag({ name: 'description', content: c.seo.description });
      this.meta.updateTag({ property: 'og:title', content: c.seo.title });
      this.meta.updateTag({ property: 'og:description', content: c.seo.description });
      this.meta.updateTag({ property: 'og:image', content: c.seo.og_image });
      this.meta.updateTag({ property: 'og:url', content: c.seo.canonical });

      let enlace = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!enlace) {
        enlace = this.document.createElement('link');
        enlace.rel = 'canonical';
        this.document.head.appendChild(enlace);
      }
      enlace.href = c.seo.canonical;
    });
  }
}
