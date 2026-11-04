import { Injectable } from '@angular/core';
import { PoliticaContrato } from '../../dominio/interfaces/politica';

// MOCK (Paso 23): las políticas las publica Laravel con versión y fecha. Los textos los entrega Josué (aprobados con un
// abogado), por eso aquí NO hay texto legal inventado: cuando `paragraphs` llega vacío, la página lo dice con claridad.
@Injectable({ providedIn: 'root' })
export class PoliticaService {
    private readonly POLITICAS: PoliticaContrato[] = [
        { slug: 'privacidad', title: 'Política de privacidad', url: '/politicas-privacidad', version: null, effective_date: null, paragraphs: [] },
        { slug: 'terminos', title: 'Términos y condiciones', url: '/terminos-y-condiciones', version: null, effective_date: null, paragraphs: [] },
        { slug: 'envios', title: 'Política de envíos', url: '/politicas-de-envio', version: null, effective_date: null, paragraphs: [] },
        { slug: 'cambios', title: 'Cambios de productos personalizados', url: '/cambios-de-productos-personalizados', version: null, effective_date: null, paragraphs: [] },
    ];

    todas(): PoliticaContrato[] { return this.POLITICAS; }
    politica(slug: string): PoliticaContrato | null { return this.POLITICAS.find(p => p.slug === slug) ?? null; }
}
