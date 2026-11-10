import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { API_URL } from '../../core/configuracion/api';
import { CargandoService } from '../componentes/cargando/CargandoService';

/** Muestra la pantalla de carga mientras haya consultas a NUESTRA API en curso (no a otros sitios). */
export const cargandoInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(inject(API_URL))) return next(req);
  const cargando = inject(CargandoService);
  cargando.iniciar();
  return next(req).pipe(finalize(() => cargando.terminar()));
};
