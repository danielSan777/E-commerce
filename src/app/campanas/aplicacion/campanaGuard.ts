import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanMatchFn, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { CategoriaService } from '../../categorias/aplicacion/servicios/CategoriaService';
import { SesionService } from '../../cuenta/aplicacion/servicios/SesionService';
import { CampanaService } from './servicios/CampanaService';

/**
 * Una dirección de un solo tramo (/navidad) es de una campaña si Laravel la conoce; si no, la ruta no
 * coincide y el router sigue con las categorías. La página de una campaña existe siempre:
 *  - en temporada se ve completa; fuera de temporada (antes de empezar, en la despedida o después) muestra que la campaña terminó, con su mensaje de cierre;
 *  - una dirección anterior (la campaña cambió de nombre) lleva a la actual;
 *  - el administrador ve siempre la página completa como quedará en temporada (vista previa de Laravel).
 * La sesión vive en el navegador, así que el servidor deja pasar y el navegador decide.
 */
export const campanaGuard: CanMatchFn = (_ruta, segmentos) => {
    if (segmentos.length !== 1) return false;
    const slug = segmentos[0].path;
    // Si ya se conocen las categorías y esta dirección es una de ellas, no hay nada que preguntarle a Laravel: entra al instante.
    if (inject(CategoriaService).esCategoria(slug)) return false;
    const router = inject(Router);
    const servicio = inject(CampanaService);
    const sesion = inject(SesionService);
    const esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

    return servicio.campana(slug).pipe(
        switchMap(c => {
            if (c && c.slug !== slug) return of(router.createUrlTree(['/', c.slug]));   // dirección anterior (le cambiaron el nombre): va a la actual
            if (c?.state === 'active') return of(true);
            if (!esNavegador) return of(c !== null);                 // servidor: sin sesión, decide el navegador
            if (!sesion.esAdministrador()) return of(c !== null);       // el público ve la página de campaña terminada
            return servicio.vistaPrevia(slug).pipe(                  // administrador: la ve aunque esté inactiva o fuera de fechas
                map(p => p === null ? false : true),
                catchError(() => of(c !== null)),
            );
        }),
        catchError(() => of(false)),
    );
};
