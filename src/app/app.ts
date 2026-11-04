import { Component, afterNextRender, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AnalyticsService } from './core/seguimiento/AnalyticsService';
import { AtribucionService } from './core/seguimiento/AtribucionService';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('el-jardin-de-sele');

  constructor() {
    const analytics = inject(AnalyticsService);
    afterNextRender(() => inject(AtribucionService).capturar());
    // page_view en cada ruta, excepto la del pedido con token (privada: no carga trackers)
    inject(Router).events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(e => {
      const ruta = e.urlAfterRedirects.split(/[?#]/)[0];
      if (!ruta.startsWith('/pedido/')) analytics.track('page_view', { page_path: ruta });
    });
  }
}
