import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { CategoriaService } from '../../categorias/aplicacion/servicios/CategoriaService';
import { CampanaService } from './servicios/CampanaService';

/**
 * Una dirección de un solo tramo (/navidad) es de una campaña si Laravel la conoce y está activa; si no, la ruta no
 * coincide y el router sigue con las categorías. Así una campaña creada en el panel tiene su página sin tocar código.
 */
export const campanaGuard: CanMatchFn = (_ruta, segmentos) => {
    if (segmentos.length !== 1) return false;
    // Si ya se conocen las categorías y esta dirección es una de ellas, no hay nada que preguntarle a Laravel: entra al instante.
    if (inject(CategoriaService).esCategoria(segmentos[0].path)) return false;
    return inject(CampanaService).campana(segmentos[0].path).pipe(
        map(c => c !== null),
        catchError(() => of(false)),
    );
};
