import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'catalogo/:slug',
    renderMode: RenderMode.Server
  },
  {
    path: 'producto/:producto',
    renderMode: RenderMode.Server
  },
  {
    path: 'producto/:producto/personalizar',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
