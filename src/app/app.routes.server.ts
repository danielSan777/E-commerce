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
    // El panel depende del token del navegador: se dibuja solo en el cliente
    path: 'admin',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin/**',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
