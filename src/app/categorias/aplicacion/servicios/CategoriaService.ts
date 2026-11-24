import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, from, map, mergeMap, of, shareReplay, tap, throwError } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { SIN_CARGANDO } from '../../../shared/interceptores/cargandoInterceptor';
import {
    CategoriaContrato, CategoriaResumen, ProductoCategoria, ProductoListado, SubcategoriaContrato,
} from '../../dominio/interfaces/categoria';

const SITIO = 'https://jardindesele.com';
/** Lo ya descargado de una categoría se conserva este tiempo: volver a ella o a una subcategoría no consulta la API. */
const VIGENCIA_MS = 15 * 60 * 1000;
/** Productos que se piden de una vez por categoría o subcategoría, y cuántos más trae «Cargar más». */
export const PRODUCTOS_POR_PAGINA = 20;
/** Cuántas subcategorías se adelantan a la vez, para no saturar a Laravel. */
const ADELANTOS_SIMULTANEOS = 3;
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
    products_total?: number;
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
    private slugs: Set<string> | null = null;
    private valores = new Map<string, { en: number; valor: CategoriaContrato | null }>();
    private recientes = new Map<string, { en: number; datos$: Observable<CategoriaContrato | null> }>();
    // Productos que «Cargar más» fue agregando a cada lista (clave `categoria|subcategoria`); se conservan junto con la primera tanda.
    private extras = signal<ReadonlyMap<string, ProductoCategoria[]>>(new Map());
    private cargandoMas = signal<ReadonlySet<string>>(new Set());

    /** Las categorías activas, en su orden (menú, inicio y tarjetas). Se piden una sola vez. */
    categorias(enSegundoPlano = false): Observable<CategoriaResumen[]> {
        this.resumenes$ ??= this.http.get<{ data: ResumenCategoriaApi[] }>(`${this.api}/categories`, { context: enSegundoPlano ? new HttpContext().set(SIN_CARGANDO, true) : undefined }).pipe(
            map(r => r.data.map(c => ({
                slug: c.slug, name: c.name, url: c.url, image: c.image ?? IMAGEN_PENDIENTE, description: c.short_description ?? '',
            }))),
            tap(lista => this.slugs = new Set(lista.map(c => c.slug))),
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
    categoria(slug: string | null, subcategoria: string | null = null, enSegundoPlano = false): Observable<CategoriaContrato | null> {
        if (!slug) return this.todos();

        // Lo ya pedido se reutiliza: volver a una subcategoría o a una categoría es instantáneo y no consulta la API.
        const clave = `${slug}|${subcategoria ?? ''}`;
        const guardado = this.recientes.get(clave);
        if (guardado && Date.now() - guardado.en < VIGENCIA_MS) return guardado.datos$;
        this.quitarExtras(clave);   // la lista se vuelve a pedir desde el principio

        const consulta = `?${subcategoria ? `subcategory=${encodeURIComponent(subcategoria)}&` : ''}limit=${PRODUCTOS_POR_PAGINA}`;
        const contexto = enSegundoPlano ? new HttpContext().set(SIN_CARGANDO, true) : undefined;
        const datos$ = this.http.get<CategoriaApi>(`${this.api}/categories/${encodeURIComponent(slug)}${consulta}`, { context: contexto }).pipe(
            map(c => this.aContrato(c)),
            catchError((e: HttpErrorResponse) => e.status === 404 ? of(null) : throwError(() => e)),
            tap(valor => this.valores.set(clave, { en: Date.now(), valor })),
            // Si la API falla no se guarda el error: la siguiente visita lo vuelve a intentar.
            catchError(e => { this.recientes.delete(clave); return throwError(() => e); }),
            shareReplay(1),
        );
        this.recientes.set(clave, { en: Date.now(), datos$ });
        return datos$;
    }

    /** ¿Esta dirección de un tramo es una categoría? true/false si ya se conocen las categorías; null si todavía no. */
    esCategoria(slug: string): boolean | null {
        return this.slugs ? this.slugs.has(slug) : null;
    }

    /** La categoría o subcategoría ya descargada (y vigente), para mostrarla en el mismo instante, sin esperar. undefined si no la hay. */
    enCache(slug: string | null, subcategoria: string | null = null): CategoriaContrato | null | undefined {
        if (!slug) return undefined;
        const v = this.valores.get(`${slug}|${subcategoria ?? ''}`);
        return v && Date.now() - v.en < VIGENCIA_MS ? v.valor : undefined;
    }

    /**
     * Adelanta en segundo plano las primeras 20 de cada subcategoría (y «Todos»), de 3 en 3, para que al tocar una pestaña ya esté lista.
     * Lo que ya está guardado no se vuelve a pedir.
     */
    adelantar(slug: string, subcategorias: (string | null)[]): void {
        from(subcategorias).pipe(
            mergeMap(sub => this.categoria(slug, sub, true).pipe(catchError(() => EMPTY)), ADELANTOS_SIMULTANEOS),
        ).subscribe();
    }

    /** Los productos que «Cargar más» agregó a esta lista, después de la primera tanda. Reactivo: úsalo dentro de un `computed`. */
    adicionales(slug: string, subcategoria: string | null): ProductoCategoria[] {
        return this.extras().get(`${slug}|${subcategoria ?? ''}`) ?? [];
    }

    /** ¿Se está pidiendo la siguiente tanda de esta lista? Reactivo. */
    estaCargandoMas(slug: string, subcategoria: string | null): boolean {
        return this.cargandoMas().has(`${slug}|${subcategoria ?? ''}`);
    }

    /** Pide otros 20 productos de la lista y los suma a lo ya cargado; quedan guardados para cuando se vuelva a ella. */
    cargarMas(actual: CategoriaContrato): void {
        const slug = actual.slug;
        const sub = actual.active_subcategory;
        const clave = `${slug}|${sub ?? ''}`;
        if (this.cargandoMas().has(clave)) return;
        const previos = this.extras().get(clave) ?? [];
        const desde = actual.products.length + previos.length;
        this.cargandoMas.update(s => new Set(s).add(clave));
        const consulta = `?${sub ? `subcategory=${encodeURIComponent(sub)}&` : ''}limit=${PRODUCTOS_POR_PAGINA}&offset=${desde}`;
        this.http.get<CategoriaApi>(`${this.api}/categories/${encodeURIComponent(slug)}${consulta}`, { context: new HttpContext().set(SIN_CARGANDO, true) }).subscribe({
            next: c => {
                const vistos = new Set([...actual.products, ...previos].map(p => p.sku));
                const nuevos = c.products.map(conImagen).filter(p => !vistos.has(p.sku));
                this.extras.update(m => new Map(m).set(clave, [...previos, ...nuevos]));
                this.cargandoMas.update(s => { const n = new Set(s); n.delete(clave); return n; });
            },
            error: () => this.cargandoMas.update(s => { const n = new Set(s); n.delete(clave); return n; }),
        });
    }

    private quitarExtras(clave: string): void {
        if (!this.extras().has(clave)) return;
        this.extras.update(m => { const n = new Map(m); n.delete(clave); return n; });
    }

    /** Productos activos, los más nuevos primero (`limite` opcional). */
    productos(limite?: number, enSegundoPlano = false): Observable<ProductoListado[]> {
        const consulta = limite ? `?limit=${limite}` : '';
        return this.http.get<{ data: ProductoListado[] }>(`${this.api}/products${consulta}`, { context: new HttpContext().set(SIN_CARGANDO, enSegundoPlano) }).pipe(map(r => r.data.map(conImagen)));
    }

    /** Complementos activos (productos de tipo "complemento"): no tienen categoría ni subcategoría. */
    complementos(enSegundoPlano = false): Observable<ProductoCategoria[]> {
        return this.http.get<{ data: ProductoCategoria[] }>(`${this.api}/products?type=complemento`, { context: new HttpContext().set(SIN_CARGANDO, enSegundoPlano) }).pipe(map(r => r.data.map(conImagen)));
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
            products_total: items.length,
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
            products_total: c.products_total ?? c.products.length,
            seo: {
                title: c.seo.title ?? `${c.name} | Jardín de Sele`,
                description: c.seo.description ?? c.headline ?? 'Macetas personalizadas con plantita natural. Envíos a todo Ecuador.',
                canonical: c.seo.canonical,
                og_image: c.seo.og_image ?? `${SITIO}/imagenes/amor.png`,
            },
        };
    }
}
