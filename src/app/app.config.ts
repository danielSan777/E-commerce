import { ApplicationConfig, Injectable, provideBrowserGlobalErrorListeners } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PreloadingStrategy, Route, provideRouter, withInMemoryScrolling, withNavigationErrorHandler, withPreloading } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { sesionInterceptor } from './administracion/aplicacion/adminAuth';
import { recargarSiLaPantallaCambio } from './core/navegacion/pantallaDesactualizada';
import { cargandoInterceptor } from './shared/interceptores/cargandoInterceptor';

/** Descarga en segundo plano todas las pantallas de la tienda, menos las del panel de administración (no las necesita el cliente). */
@Injectable({ providedIn: 'root' })
export class PrecargaDePantallas implements PreloadingStrategy {
  preload(ruta: Route, descargar: () => Observable<unknown>): Observable<unknown> {
    return ruta.path?.startsWith('admin') ? of(null) : descargar();
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }), withPreloading(PrecargaDePantallas), withNavigationErrorHandler(recargarSiLaPantallaCambio)), provideClientHydration(),
    provideHttpClient(withFetch(), withInterceptors([cargandoInterceptor, sesionInterceptor]))
  ]
};
