import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, throwError } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import {
    CategoriaContrato, CategoriaResumen, ProductoCategoria, ProductoListado, SubcategoriaContrato,
} from '../../dominio/interfaces/categoria';

const SITIO = 'https://jardindesele.com';
/** Foto que se muestra mientras un producto o una categoría todavía no tiene imagen subida. */
export const IMAGEN_PENDIENTE = 'imagenes/sin-imagen.svg';

// Respuestas de Laravel (GET /api/v1/categories, /categories/{slug}, /products). Nombres iguales a los de la API.
interface MedioApi { type: 'image' | 'video'; srcset?: Record<string, string>; url?: string; poster?: string | null }
interface ResumenCategoriaApi {
    slug: string; name: string; url: string; short_description: string | null; image: string | null;
    subcategories: { slug: string; name: string; url: string }[];
}
interface CategoriaApi {
    slug: string; name: string; headline: string | null; intro_html: string | null; hero: MedioApi | null; hero_video?: MedioApi | null; hero_videos?: MedioApi[];
    price_from_cents: number | null;
    subcategories: { slug: string; name: string; url: string }[];
    active_subcategory: string | null;
    products: ProductoCategoria[];
    seo: { title: string | null; description: string | null; canonical: string; og_image: string | null };
}

// Un producto del índice de búsqueda: lo que se puede buscar de él
export interface EntradaIndice {
    producto: ProductoCategoria;
    textos: string[];   // nombre, palabras de búsqueda, categoría y subcategoría
}

const escapar = (texto: string) =>
    texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** La introducción se escribe como texto simple en el panel: cada línea en blanco separa un párrafo. */
function introAHtml(texto: string | null): string {
    return (texto ?? '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(p => `<p>${escapar(p).replace(/\n/g, '<br>')}</p>`).join('');
}

const conImagen = <T extends { image: string | null }>(p: T): T & { image: string } => ({ ...p, image: p.image ?? IMAGEN_PENDIENTE });

// Catálogo público: Angular solo muestra lo que Laravel responde (precios, descuentos, qué productos entran).
// En el servidor (SSR) las llamadas se hacen antes de entregar la página, así Google recibe el HTML completo.
@Injectable({ providedIn: 'root' })
export class CategoriaService {
    private http = inject(HttpClient);
    private api = inject(API_URL);

    private resumenes$?: Observable<CategoriaResumen[]>;

    /** Las categorías activas, en su orden (menú, inicio y tarjetas). Se piden una sola vez. */
    categorias(): Observable<CategoriaResumen[]> {
        this.resumenes$ ??= this.http.get<{ data: ResumenCategoriaApi[] }>(`${this.api}/categories`).pipe(
            map(r => r.data.map(c => ({
                slug: c.slug, name: c.name, url: c.url, image: c.image ?? IMAGEN_PENDIENTE, description: c.short_description ?? '',
            }))),
            // Si la API falla no se guarda el error: la siguiente visita lo vuelve a intentar.
            catchError(e => { this.resumenes$ = undefined; return throwError(() => e); }),
            shareReplay(1),
        );
        return this.resumenes$;
    }

    /**
     * Sin slug (`/categorias`): todos los productos. Con categoría o subcategoría que no existe: null (404).
     * Cualquier otro error de la API se propaga.
     */
    categoria(slug: string | null, subcategoria: string | null = null): Observable<CategoriaContrato | null> {
        if (!slug) return this.todos();

        const consulta = subcategoria ? `?subcategory=${encodeURIComponent(subcategoria)}` : '';
        return this.http.get<CategoriaApi>(`${this.api}/categories/${encodeURIComponent(slug)}${consulta}`).pipe(
            map(c => this.aContrato(c)),
            catchError((e: HttpErrorResponse) => e.status === 404 ? of(null) : throwError(() => e)),
        );
    }

    /** Productos activos, los más nuevos primero (`limite` opcional). */
    productos(limite?: number): Observable<ProductoListado[]> {
        const consulta = limite ? `?limit=${limite}` : '';
        return this.http.get<{ data: ProductoListado[] }>(`${this.api}/products${consulta}`).pipe(map(r => r.data.map(conImagen)));
    }

    /** Favoritos de la página principal: mientras no se elijan a mano en el panel, los 6 productos más nuevos. */
    favoritos(): Observable<ProductoCategoria[]> {
        return this.productos(6);
    }

    /** Índice para la búsqueda: nombre, palabras de búsqueda, categoría y subcategoría de cada producto. */
    indice(): Observable<EntradaIndice[]> {
        return this.productos().pipe(map(lista => lista.map(p => ({
            producto: p,
            textos: [p.name, ...p.search_terms, p.category.name, p.subcategory?.name ?? ''].filter(Boolean),
        }))));
    }

    private todos(): Observable<CategoriaContrato> {
        return this.productos().pipe(map(items => ({
            slug: 'categorias',
            name: 'Categorías',
            headline: 'Encuentra tu detalle perfecto',
            intro_html: '<p>Elige una categoría y personaliza tu maceta con su nombre y una plantita natural.</p>',
            short_description: 'Elige una categoría y encuentra tu detalle perfecto.',
            price_from_cents: 0,
            subcategories: [],
            active_subcategory: null,
            products: items,
            seo: {
                title: 'Todos los productos | Jardín de Sele',
                description: 'Macetas personalizadas con plantita natural. Envíos a todo Ecuador.',
                canonical: `${SITIO}/categorias`,
                og_image: `${SITIO}/imagenes/amor.png`,
            },
        })));
    }

    private aContrato(c: CategoriaApi): CategoriaContrato {
        const foto = c.hero?.type === 'image' ? c.hero.srcset?.['1080'] ?? Object.values(c.hero.srcset ?? {}).pop() : undefined;
        const subcategories: SubcategoriaContrato[] = c.subcategories.map(s => ({ slug: s.slug, name: s.name, url: s.url }));
        return {
            slug: c.slug,
            name: c.name,
            headline: c.headline ?? '',
            intro_html: introAHtml(c.intro_html),
            hero: foto ? { type: 'image', url: foto } : undefined,
            videos: (c.hero_videos ?? (c.hero_video ? [c.hero_video] : [])).filter(v => v.type === 'video' && !!v.url).map(v => ({ url: v.url!, poster: v.poster ?? undefined })),
            video: c.hero_video?.type === 'video' && c.hero_video.url ? { url: c.hero_video.url, poster: c.hero_video.poster ?? undefined } : undefined,
            short_description: c.headline ?? '',
            price_from_cents: c.price_from_cents ?? 0,
            subcategories,
            active_subcategory: c.active_subcategory,
            products: c.products.map(conImagen),
            seo: {
                title: c.seo.title ?? `${c.name} | Jardín de Sele`,
                description: c.seo.description ?? c.headline ?? 'Macetas personalizadas con plantita natural. Envíos a todo Ecuador.',
                canonical: c.seo.canonical,
                og_image: c.seo.og_image ?? `${SITIO}/imagenes/amor.png`,
            },
        };
    }
}
