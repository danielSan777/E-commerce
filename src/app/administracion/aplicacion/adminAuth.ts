import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_URL } from '../../core/configuracion/api';
import { SesionService } from '../../cuenta/aplicacion/servicios/SesionService';

/** Rutas de la API que llevan el token: la cuenta (`/auth/*`, salvo login y registro) y la administración (`/admin/*`). */
function llevaToken(url: string, api: string): boolean {
  if (url.startsWith(`${api}/admin/`)) return true;
  return url.startsWith(`${api}/auth/`) && !url.endsWith('/auth/login') && !url.endsWith('/auth/register');
}

/** Añade el token Bearer solo a esas rutas (nunca a la API pública ni al login). */
export const sesionInterceptor: HttpInterceptorFn = (req, next) => {
  const api = inject(API_URL);
  const sesion = inject(SesionService);
  const router = inject(Router);

  if (!llevaToken(req.url, api)) return next(req);

  const token = sesion.token();
  const conToken = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(conToken).pipe(
    catchError((e) => {
      // Token vencido o cerrado en otro dispositivo: volver al ingreso y regresar a esta pantalla después.
      if (e?.status === 401 && !req.url.endsWith('/logout') && !req.url.endsWith('/logout-all')) {
        const eraAdministrador = sesion.esAdministrador();
        sesion.olvidar();
        router.navigate(['/ingresar'], { queryParams: { returnUrl: router.url, ...(eraAdministrador ? { motivo: 'vencida' } : {}) } });
      }
      return throwError(() => e);
    }),
  );
};

/** Pantallas que piden estar identificado (cliente o administrador). */
export const sesionGuard: CanActivateFn = (_ruta, estado) => {
  const sesion = inject(SesionService);
  return sesion.estaAutenticado() || inject(Router).createUrlTree(['/ingresar'], { queryParams: { returnUrl: estado.url } });
};

/** Panel del administrador. Sin sesión va al ingreso; un cliente va a su cuenta. (Laravel igual responde 403 a un cliente.) */
export const adminGuard: CanActivateFn = (_ruta, estado) => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  if (!sesion.estaAutenticado()) {
    // Si había una sesión guardada y ya venció, se avisa por qué volvió al ingreso.
    return router.createUrlTree(['/ingresar'], { queryParams: { returnUrl: estado.url, ...(sesion.venciaEnEsteEquipo() ? { motivo: 'vencida' } : {}) } });
  }
  return sesion.esAdministrador() || router.createUrlTree(['/mi-cuenta']);
};
