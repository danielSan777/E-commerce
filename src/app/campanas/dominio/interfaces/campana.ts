// Contrato del Paso 0: campaña de temporada (San Valentín y las que se creen después).
// Nombres en inglés y snake_case: son idénticos a la respuesta de Laravel. Angular solo muestra estos campos.
import { ProductoCategoria, SeoContrato } from '../../../categorias/dominio/interfaces/categoria';

/** Diseño propio de la campaña. Cualquier parte puede faltar: la página usa entonces sus colores y corazones de siempre. */
export interface TemaCampana {
    color: string | null;                 // "#C2185B"
    emoji: string | null;                 // "🎄"
    cover: { alt: string | null; w: number | null; h: number | null; srcset: Record<string, string> } | null;   // portada (foto)
    video: { url: string; poster: string | null; duration_s: number | null } | null;                              // portada (video de hasta 1 minuto)
}

/** Resumen de la campaña en temporada (GET /campaigns/current) para el banner de la página principal. */
export interface CampanaResumen {
    slug: string;
    name: string;
    state: 'active' | 'closing';          // en temporada | despidiéndose (se muestra el mensaje de cierre)
    closing_message: string | null;       // "San Valentín regresará pronto": solo cuando state es 'closing'
    url: string;                          // "/navidad"
    season_year: number;
    event_date: string;
    tagline: string | null;
    slogan: string | null;
    theme: TemaCampana;
}

export interface CampanaContrato {
    slug: string;
    name: string;
    state: 'active' | 'closing' | 'upcoming';   // en temporada | despidiéndose | fuera de temporada
    closing_message: string | null;
    season_year: number;
    event_date: string;                   // YYYY-MM-DD
    order_deadline: { date: string; label: string } | null;   // Laravel la informa cuando exista el calendario operativo (Paso 9)
    tagline: string;                      // "Un regalo con su nombre que sigue creciendo"
    slogan: string;                       // frase del banner de en medio
    theme: TemaCampana;
    products: ProductoCategoria[];        // en temporada: los elegidos por Josué; fuera: los relacionados
    seo: SeoContrato;
}
