import { Component, afterNextRender, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Avisos } from './shared/componentes/avisos/avisos';
import { AnalyticsService } from './core/seguimiento/AnalyticsService';
import { AtribucionService } from './core/seguimiento/AtribucionService';

@Component({
  imports: [RouterOutlet, Avisos],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('el-jardin-de-sele');

  constructor() {
    const analytics = inject(AnalyticsService);
    const atribucion = inject(AtribucionService);
    afterNextRender(() => {
      atribucion.capturar();
      document.addEventListener('click', e => this.clicDelegado(e, analytics));
    });
    // page_view en cada ruta, excepto la del pedido con token (privada: no carga trackers)
    inject(Router).events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(e => {
      const ruta = e.urlAfterRedirects.split(/[?#]/)[0];
      if (!ruta.startsWith('/pedido/')) analytics.track('page_view', { page_path: ruta });
    });
  }

  // Eventos de experiencia (solo GA4) detectados por el destino del enlace tocado, sin tocar cada plantilla
  private clicDelegado(e: Event, analytics: AnalyticsService): void {
    const a = (e.target as Element | null)?.closest?.('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') ?? '';
    const ruta = location.pathname;

    if (/wa\.me|api\.whatsapp\.com/.test(href)) {
      analytics.track('whatsapp_click', { place: a.closest('footer') ? 'footer' : a.classList.contains('whatsapp-flotante') ? 'floating' : ruta });
    } else if (href.startsWith('/producto/') && !href.endsWith('/personalizar')) {
      const lista = ruta.startsWith('/buscar') ? 'search' : ruta.startsWith('/carrito') ? 'cart' : ruta.startsWith('/producto/') ? 'related'
        : ruta === '/san-valentin' ? 'campaign' : ruta === '/' ? 'home' : 'category';
      analytics.track('select_item', { item_list_name: lista, items: [{ item_id: href.split('/')[2] }] });
    } else if (a.closest('nav.pestanas')) {
      analytics.track('select_subcategory', { subcategory: href.split('/').pop() });
    }
  }
}
