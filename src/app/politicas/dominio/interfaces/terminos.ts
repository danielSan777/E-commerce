import { CapituloTerminos } from '../../aplicacion/servicios/terminos-contenido';

// Términos y condiciones publicados (tabla `policies` de Laravel, Paso 23). Es una sola página: incluye envíos,
// cambios, cancelaciones, devoluciones y datos del cliente. `version` y `effective_date` los pone Laravel.
export interface TerminosContrato {
    slug: 'terminos';
    title: string;
    url: '/terminos-y-condiciones';
    version: string | null;
    effective_date: string | null;     // YYYY-MM-DD
    chapters: CapituloTerminos[];
}
