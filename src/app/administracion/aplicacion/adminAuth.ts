import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_URL } from '../../core/configuracion/api';
import { SesionAdminService } from './servicios/SesionAdminService';

/** Añade el token Bearer solo a las llamadas `/admin/*` (nunca al login ni a la API pública). */
export const adminAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const api = inject(API_URL);
  const sesion = inject(SesionAdminService);
  const router = inject(Router);

  const esAdmin = req.url.startsWith(`${api}/admin/`) && !req.url.endsWith('/admin/login');
  if (!esAdmin) return next(req);

  const token = sesion.token();
  const conToken = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(conToken).pipe(
    catchError((e) => {
      // Token vencido o cerrado en otro dispositivo: volver al login y regresar a esta pantalla después.
      if (e?.status === 401 && !req.url.endsWith('/logout') && !req.url.endsWith('/logout-all')) {
        sesion.olvidar();
        router.navigate(['/admin/login'], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => e);
    }),
  );
};

/** Protege el panel: sin sesión vigente va al login y vuelve a la pantalla pedida. */
export const adminGuard: CanActivateFn = (_ruta, estado) => {
  const sesion = inject(SesionAdminService);
  return sesion.estaAutenticado() || inject(Router).createUrlTree(['/admin/login'], { queryParams: { returnUrl: estado.url } });
};
