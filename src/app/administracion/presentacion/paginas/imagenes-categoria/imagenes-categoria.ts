import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GaleriaImagenes } from '../../componentes/galeria-imagenes/galeria-imagenes';

// Imágenes de una categoría (portada, redes y Google).
@Component({
  selector: 'app-admin-imagenes-categoria',
  imports: [RouterLink, GaleriaImagenes],
  template: `
    <header class="barra">
      <strong>Imágenes de la categoría</strong>
      <a routerLink="/admin/categorias">← Volver a categorías</a>
    </header>
    <main class="contenido">
      <p>Categoría: <code>{{ slug }}</code></p>
      <app-galeria-imagenes dueno="categories" [clave]="slug" />
    </main>
  `,
  styleUrl: '../subcategorias/subcategorias.css',
})
export class AdminImagenesCategoria {
  readonly slug = inject(ActivatedRoute).snapshot.paramMap.get('slug') ?? '';

  constructor() {
    inject(Title).setTitle('Imágenes de la categoría | Panel de Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }
}
