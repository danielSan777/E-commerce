import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { API_URL } from '../../core/configuracion/api';
import { CargandoService } from '../componentes/cargando/CargandoService';

/** Consultas en segundo plano (por ejemplo, adelantar la siguiente pantalla): no muestran la pantalla de carga. */
export const SIN_CARGANDO = new HttpContextToken<boolean>(() => false);

/** Muestra la pantalla de carga mientras haya consultas a NUESTRA API en curso (no a otros sitios). */
export const cargandoInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(inject(API_URL)) || req.context.get(SIN_CARGANDO)) return next(req);
  const cargando = inject(CargandoService);
  cargando.iniciar();
  return next(req).pipe(finalize(() => cargando.terminar()));
};
