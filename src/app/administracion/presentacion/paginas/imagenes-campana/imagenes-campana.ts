import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GaleriaImagenes } from '../../componentes/galeria-imagenes/galeria-imagenes';

// Imágenes de una campaña. La primera imagen de la lista es la portada del banner de la página principal y de la campaña.
@Component({
  selector: 'app-admin-imagenes-campana',
  imports: [RouterLink, GaleriaImagenes],
  template: `
    <header class="barra">
      <strong>Portada de la campaña</strong>
      <a routerLink="/admin/campanas">← Volver a campañas</a>
    </header>
    <main class="contenido">
      <p>Campaña: <code>{{ slug }}</code></p>
      <p class="ayuda">La <b>primera</b> imagen de la lista es la portada: se ve en el banner de la página principal y arriba de la página de la campaña. Si quieres cambiarla, elimina la actual y sube otra.</p>
      <app-galeria-imagenes dueno="campaigns" [clave]="slug" />
    </main>
  `,
  styleUrl: '../subcategorias/subcategorias.css',
})
export class AdminImagenesCampana {
  readonly slug = inject(ActivatedRoute).snapshot.paramMap.get('slug') ?? '';

  constructor() {
    inject(Title).setTitle('Portada de la campaña | Panel de Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }
}
