import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { CategoriaService } from '../../categorias/aplicacion/servicios/CategoriaService';
import { CampanaService } from './servicios/CampanaService';

/**
 * Una dirección de un solo tramo (/navidad) es de una campaña si Laravel la conoce; si no, la ruta no
 * coincide y el router sigue con las categorías. Solo se puede ver la página mientras la campaña está en temporada:
 * antes de empezar o después de terminar (aunque se muestre su mensaje de cierre en la principal) lleva a la página principal. Así una campaña creada en el panel tiene su página sin tocar código.
 */
export const campanaGuard: CanMatchFn = (_ruta, segmentos) => {
    if (segmentos.length !== 1) return false;
    // Si ya se conocen las categorías y esta dirección es una de ellas, no hay nada que preguntarle a Laravel: entra al instante.
    if (inject(CategoriaService).esCategoria(segmentos[0].path)) return false;
    const router = inject(Router);
    return inject(CampanaService).campana(segmentos[0].path).pipe(
        map(c => c === null ? false : c.state === 'active' ? true : router.createUrlTree(['/'])),
        catchError(() => of(false)),
    );
};
