import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { sesionInterceptor } from './administracion/aplicacion/adminAuth';
import { cargandoInterceptor } from './shared/interceptores/cargandoInterceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })), provideClientHydration(),
    provideHttpClient(withFetch(), withInterceptors([cargandoInterceptor, sesionInterceptor]))
  ]
};
