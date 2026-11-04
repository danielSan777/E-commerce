// Contrato del Paso 0: campaña de temporada (San Valentín y las que se creen después).
// Nombres en inglés y snake_case: son idénticos a la respuesta de Laravel. Angular solo muestra estos campos.
import { ProductoCategoria, SeoContrato } from '../../../categorias/dominio/interfaces/categoria';

export interface CampanaContrato {
    slug: string;
    name: string;
    state: 'active' | 'upcoming';         // en temporada | fuera de temporada
    season_year: number;
    event_date: string;                   // YYYY-MM-DD
    order_deadline: { date: string; label: string };
    tagline: string;                      // "Un regalo con su nombre que sigue creciendo"
    slogan: string;                       // frase del banner de en medio
    related_category: { slug: string; name: string; url: string };
    products: ProductoCategoria[];        // en temporada: los elegidos por Josué; fuera: los relacionados
    seo: SeoContrato;
}
