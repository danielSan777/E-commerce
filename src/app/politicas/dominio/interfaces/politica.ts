// Política legal publicada con versión y fecha (tabla `policies` de Laravel, Paso 23).
export interface PoliticaContrato {
    slug: 'privacidad' | 'terminos' | 'envios' | 'cambios';
    title: string;
    url: string;
    version: string | null;            // null mientras Josué no entrega el texto aprobado
    effective_date: string | null;     // YYYY-MM-DD
    paragraphs: string[];              // texto aprobado; vacío si aún no existe
}
