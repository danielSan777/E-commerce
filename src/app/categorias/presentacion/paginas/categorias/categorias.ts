import { Component, DOCUMENT, computed, effect, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { CategoriaService } from '../../../aplicacion/servicios/CategoriaService';
import { PromesaService } from '../../../../checkout/aplicacion/servicios/PromesaService';
import { NoEncontrada } from '../../../../core/paginas/no-encontrada/no-encontrada';

// Pantalla de categorías. Una sola plantilla para /categorias, /{categoria} y /{categoria}/{subcategoria}:
// cada estado tiene su URL, y cambiar de categoría o de pestaña solo cambia la URL (no recarga la página).
@Component({
  selector: 'app-categorias',
  imports: [CurrencyPipe, RouterLink, RouterLinkActive, NoEncontrada],
  templateUrl: './categorias.html',
  styleUrl: './categorias.css',
})
export class Categorias {
  private route = inject(ActivatedRoute);
  private servicio = inject(CategoriaService);
  private document = inject(DOCUMENT);
  private titulo = inject(Title);
  private meta = inject(Meta);

  // La categoría viene en los datos de la ruta (/amor) y la subcategoría en el parámetro (/profesiones-y-hobbies/salud)
  private datos = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  private parametros = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });

  readonly tarjetas = this.servicio.categorias();
  readonly promesa = inject(PromesaService).promesa();

  categoria = computed(() =>
    this.servicio.categoria(this.datos()['categoria'] ?? null, this.parametros().get('subcategoria')));

  // Ruta del botón "Todos" de las pestañas
  rutaTodos = computed(() => `/${this.categoria()?.slug}`);
  enCategorias = computed(() => this.categoria()?.slug === 'categorias');

  constructor() {
    // SEO por estado: título, descripción, imagen para compartir y canonical (sin UTMs)
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
