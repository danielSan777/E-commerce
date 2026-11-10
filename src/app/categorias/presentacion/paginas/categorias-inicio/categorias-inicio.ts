import { Component, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { VideoAuto } from '../../../../shared/directivas/video-auto';
import { PortadaInicioService } from '../../../../inicio/aplicacion/servicios/PortadaInicioService';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { CategoriaService } from '../../../aplicacion/servicios/CategoriaService';
import { ComoFunciona } from '../../../../shared/componentes/como-funciona/como-funciona';

// /categorias: puerta de entrada. Elegir cómo empezar a explorar (las 4 categorías) y cómo funciona la compra.
@Component({
  selector: 'app-categorias-inicio',
  imports: [RouterLink, ComoFunciona, VideoAuto],
  templateUrl: './categorias-inicio.html',
  styleUrl: './categorias-inicio.css',
})
export class CategoriasInicio {
  private servicio = inject(CategoriaService);

  readonly tarjetas = toSignal(this.servicio.categorias().pipe(catchError(() => of([]))), { initialValue: [] });
  // Encabezado editable desde el panel: título, subtítulo y las imágenes o videos de la derecha.
  // null = todavía cargando: no se muestra nada para que no parpadeen los textos y fotos de siempre.
  private encabezado = toSignal(inject(PortadaInicioService).encabezadoCategorias(), { initialValue: null });
  readonly cargado = computed(() => this.encabezado() !== null);
  readonly titulo = computed(() => this.encabezado()?.title || 'Explora nuestros regalos');
  readonly subtituloBanner = computed(() => this.encabezado()?.subtitle || 'Encuentra la categoría ideal para sorprender.');
  readonly medios = computed(() => this.encabezado()?.items ?? []);
  readonly indice = signal(0);
  readonly medio = computed(() => { const l = this.medios(); return l.length ? l[this.indice() % l.length] : null; });
  readonly varios = computed(() => this.medios().length > 1);
  readonly actual = computed(() => { const m = this.medio(); return m ? [m] : []; });
  siguiente(): void { this.indice.update(i => (i + 1) % Math.max(this.medios().length, 1)); }
  imagenDe(m: { type: string; srcset?: Record<string, string> }): string { return m.srcset?.['1080'] ?? Object.values(m.srcset ?? {}).pop() ?? ''; }
  readonly seo = {
    title: 'Todos los productos | Jardín de Sele',
    description: 'Macetas personalizadas con plantita natural. Envíos a todo Ecuador.',
  };

  constructor() {
    // Con varias imágenes seguidas, cada una pasa sola a los 6 s (el video avisa al terminar)
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      effect(onCleanup => {
        this.indice();
        if (!this.varios() || this.medio()?.type === 'video') return;
        const t = setTimeout(() => this.siguiente(), 6000);
        onCleanup(() => clearTimeout(t));
      });
    }
    inject(Title).setTitle(this.seo.title);
    inject(Meta).updateTag({ name: 'description', content: this.seo.description });
  }
}
