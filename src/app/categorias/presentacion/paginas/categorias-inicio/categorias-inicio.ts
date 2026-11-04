import { Component, computed, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { CategoriaService } from '../../../aplicacion/servicios/CategoriaService';
import { ComoFunciona } from '../../../../shared/componentes/como-funciona/como-funciona';

// /categorias: puerta de entrada. Elegir cómo empezar a explorar (las 4 categorías) y cómo funciona la compra.
@Component({
  selector: 'app-categorias-inicio',
  imports: [RouterLink, ComoFunciona],
  templateUrl: './categorias-inicio.html',
  styleUrl: './categorias-inicio.css',
})
export class CategoriasInicio {
  private servicio = inject(CategoriaService);

  readonly tarjetas = this.servicio.categorias();
  // Video del banner (H.264 sin audio). Mientras sea null se muestra solo el banner con imágenes.
  readonly VIDEO: string | null = null;
  readonly seo = computed(() => this.servicio.categoria(null)!.seo);

  constructor() {
    inject(Title).setTitle(this.seo().title);
    inject(Meta).updateTag({ name: 'description', content: this.seo().description });
  }
}
