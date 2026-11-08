import { Injectable, inject } from '@angular/core';
import { CatalogoDePrueba } from '../../../categorias/aplicacion/servicios/CatalogoDePrueba';
import { CampanaContrato } from '../../dominio/interfaces/campana';

const SITIO = 'https://jardindesele.com';

// MOCK (Paso 0): devuelve la forma exacta que entregará Laravel para una campaña. Con backend, el estado
// (en temporada o no), el año, las fechas y la selección ordenada de productos los decide el panel (Paso 9).
@Injectable({ providedIn: 'root' })
export class CampanaService {
    private categorias = inject(CatalogoDePrueba);

    // ===== MOCK EDITABLE =====
    // 'active' muestra la campaña con sus productos; 'upcoming', el "llegará muy pronto".
    private readonly ESTADO: CampanaContrato['state'] = 'active';
    private readonly PRODUCTOS_ELEGIDOS = [
        'bob-corazon-hombre', 'amigo-guitarrista', 'homero', 'doctor', 'abogada', 'enfermera',
    ];
    // =========================

    campana(slug: string): CampanaContrato | null {
        if (slug !== 'san-valentin') return null;

        const relacionados = this.categorias.categoria('amor')!.products;
        return {
            slug: 'san-valentin',
            name: 'San Valentín',
            state: this.ESTADO,
            season_year: 2027,
            event_date: '2027-02-14',
            order_deadline: { date: '2027-02-09', label: 'Pide hasta el martes 9 para recibir antes del 14 de febrero' },
            tagline: 'Un regalo con su nombre que sigue creciendo',
            slogan: 'Las flores duran una semana. Esta maceta, años.',
            related_category: { slug: 'amor', name: 'Amor', url: '/amor' },
            products: this.ESTADO === 'active' ? this.categorias.productosPorSlug(this.PRODUCTOS_ELEGIDOS) : relacionados,
            seo: {
                title: 'San Valentín | Jardín de Sele',
                description: 'Macetas personalizadas con su nombre para San Valentín. Un regalo que sigue creciendo.',
                canonical: `${SITIO}/san-valentin`,
                og_image: `${SITIO}/imagenes/amor-amistad/Bob corazón Hombre.png`,
            },
        };
    }
}
