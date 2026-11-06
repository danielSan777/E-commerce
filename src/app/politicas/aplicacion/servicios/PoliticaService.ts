import { Injectable } from '@angular/core';
import { TerminosContrato } from '../../dominio/interfaces/terminos';
import { CAPITULOS_TERMINOS, TITULO_TERMINOS } from './terminos-contenido';

// MOCK (Paso 23): Laravel publicará los términos con versión y fecha. El texto es el oficial entregado por Josué.
// `version` y `effective_date` quedan en null hasta que Laravel los entregue (no se inventan).
@Injectable({ providedIn: 'root' })
export class PoliticaService {
    terminos(): TerminosContrato {
        return { slug: 'terminos', title: TITULO_TERMINOS, url: '/terminos-y-condiciones', version: null, effective_date: null, chapters: CAPITULOS_TERMINOS };
    }
}
