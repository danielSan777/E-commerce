import { Injectable } from '@angular/core';
import { productos, Producto } from '../../../all-productos/dominio/muestra_producto';
import {
    CategoriaContrato, CategoriaResumen, PrecioContrato, ProductoCategoria, SubcategoriaContrato,
} from '../../dominio/interfaces/categoria';

const SITIO = 'https://jardindesele.com';

interface DatosCategoria {
    slug: string;
    name: string;
    headline: string;
    intro: string;
    corta: string;
    image: string;
    subcategorias: { slug: string; name: string; icono: string; descripcion: string }[];
}

// Subcategorías iniciales de Profesiones y Hobbies (Paso 6). Las de Amor, Amistad y Familia las define Josué:
// mientras no existan, la categoría se muestra sin pestañas.
const CATEGORIAS: DatosCategoria[] = [
    {
        slug: 'profesiones-y-hobbies', name: 'Profesiones y Hobbies',
        headline: 'Un detalle para quien ama lo que hace',
        intro: 'Regalos personalizados para cada profesión, pasión u oficio.',
        corta: 'Profesiones, oficios y pasiones.',
        image: 'imagenes/profesionales/doctor.png',
        subcategorias: [
            { slug: 'salud', name: 'Salud', icono: 'bi-heart-pulse', descripcion: 'Detalles únicos para quienes cuidan y dan bienestar.' },
            { slug: 'administrativos', name: 'Administrativos', icono: 'bi-briefcase', descripcion: 'Para quienes organizan, asesoran y sacan el trabajo adelante.' },
            { slug: 'fuerza-publica', name: 'Fuerza Pública', icono: 'bi-shield-check', descripcion: 'Un reconocimiento para quienes nos cuidan y protegen.' },
            { slug: 'cocina-y-hobbies', name: 'Cocina y Hobbies', icono: 'bi-cup-hot', descripcion: 'Para quienes disfrutan lo que más les gusta hacer.' },
        ],
    },
    {
        slug: 'amor', name: 'Amor',
        headline: 'Dile lo que sientes con un detalle que crece',
        intro: 'Regalos para parejas y enamorados, personalizados con su nombre y una dedicatoria.',
        corta: 'Regalos con emoción y romance.',
        image: 'imagenes/amor-amistad/Bob corazón Hombre.png', subcategorias: [],
    },
    {
        slug: 'amistad', name: 'Amistad',
        headline: 'Para ese amigo que siempre está',
        intro: 'Macetas con personajes y detalles para sorprender a tus amigos en su cumpleaños o sin motivo.',
        corta: 'Detalles para amistades especiales.',
        image: 'imagenes/amor-amistad/Amigo-guitarrista.png', subcategorias: [],
    },
    {
        slug: 'familia', name: 'Familia',
        headline: 'Un regalo para los tuyos',
        intro: 'Detalles para mamá, papá, hermanos y abuelos, hechos a su medida.',
        corta: 'Regalos con cariño para los tuyos.',
        image: 'imagenes/colecciones/personajes/homero.png', subcategorias: [],
    },
];

// MOCK: a qué categoría y subcategoría pertenece cada producto de prueba (con backend lo trae cada producto).
const UBICACION: Record<string, [string, string | null]> = {
    'amigo-guitarrista': ['amistad', null],
    'bob-corazon-hombre': ['amor', null],
    'baby-garfield': ['amistad', null],
    'bellota-chicas-super-poderosas': ['amistad', null],
    'abogada': ['profesiones-y-hobbies', 'administrativos'],
    'abogado': ['profesiones-y-hobbies', 'administrativos'],
    'doctor': ['profesiones-y-hobbies', 'salud'],
    'enfermera': ['profesiones-y-hobbies', 'salud'],
    'homero': ['familia', null],
    'lucas-con-pantalon-personalizado': ['amistad', null],
};

// MOCK: sinónimos para la búsqueda (con backend los edita Josué en el panel, Paso 19)
const SINONIMOS: Record<string, string[]> = {
    'doctor': ['medico', 'doctora', 'salud'],
    'enfermera': ['enfermero', 'salud'],
    'abogada': ['licenciada', 'leyes'],
    'abogado': ['licenciado', 'leyes'],
    'homero': ['simpson', 'papa'],
    'bob-corazon-hombre': ['novio', 'esposo', 'pareja'],
    'amigo-guitarrista': ['musico', 'musica'],
};

// Un producto del índice de búsqueda: lo que se puede buscar de él
export interface EntradaIndice {
    producto: ProductoCategoria;
    textos: string[];   // nombre, sinónimos, categoría y subcategoría
}

// MOCK (Paso 0): devuelve la forma exacta que entregará Laravel para categoría con subcategorías. Con backend solo
// cambia el cuerpo de estos métodos por la llamada a la API; la pantalla no se toca.
@Injectable({ providedIn: 'root' })
export class CategoriaService {

    categorias(): CategoriaResumen[] {
        return CATEGORIAS.map(c => ({ slug: c.slug, name: c.name, url: `/${c.slug}`, image: c.image, description: c.corta }));
    }

    // Sin categoría (`/categorias`): todos los productos. Con categoría inexistente o subcategoría inexistente: null (404).
    categoria(slug: string | null, subcategoria: string | null = null): CategoriaContrato | null {
        const datos = slug ? CATEGORIAS.find(c => c.slug === slug) : null;
        if (slug && !datos) return null;
        if (subcategoria && !datos?.subcategorias.some(s => s.slug === subcategoria)) return null;

        const lista = productos.filter(p => {
            const u = this.ubicacion(p);
            if (!u) return false;
            if (!datos) return true;
            return u[0] === datos.slug && (!subcategoria || u[1] === subcategoria);
        });
        const items = lista.map(p => this.aProducto(p));

        const subcategories: SubcategoriaContrato[] = (datos?.subcategorias ?? []).map(s => ({
            slug: s.slug, name: s.name, url: `/${datos!.slug}/${s.slug}`, icon: s.icono, description: s.descripcion,
        }));

        const activa = datos?.subcategorias.find(s => s.slug === subcategoria);
        const nombre = activa ? `${activa.name} · ${datos!.name}` : datos?.name ?? 'Todos los productos';
        const ruta = datos ? (activa ? `/${datos.slug}/${activa.slug}` : `/${datos.slug}`) : '/categorias';

        return {
            slug: datos?.slug ?? 'categorias',
            name: datos?.name ?? 'Categorías',
            headline: datos?.headline ?? 'Encuentra tu detalle perfecto',
            intro_html: `<p>${datos?.intro ?? 'Elige una categoría y personaliza tu maceta con su nombre y una plantita natural.'}</p>`,
            hero: datos ? { type: 'image', url: datos.image } : undefined,
            short_description: datos?.corta ?? 'Elige una categoría y encuentra tu detalle perfecto.',
            price_from_cents: items.length ? Math.min(...items.map(i => i.price.final_cents)) : 0,
            subcategories,
            active_subcategory: subcategoria,
            products: items,
            seo: {
                title: `${nombre} | Jardín de Sele`,
                description: activa
                    ? `Macetas personalizadas de ${activa.name} en ${datos!.name}. Recíbelas con su plantita en todo Ecuador.`
                    : (datos?.intro ?? 'Macetas personalizadas con plantita natural. Envíos a todo Ecuador.'),
                canonical: `${SITIO}${ruta}`,
                og_image: `${SITIO}/${datos?.image ?? 'imagenes/amor.png'}`,
            },
        };
    }

    // Índice pequeño para la búsqueda: nombre, sinónimos, categoría y subcategoría de cada producto
    indice(): EntradaIndice[] {
        return productos.flatMap(p => {
            const u = this.ubicacion(p);
            if (!u) return [];
            const cat = CATEGORIAS.find(c => c.slug === u[0]);
            const sub = cat?.subcategorias.find(s => s.slug === u[1]);
            return [{
                producto: this.aProducto(p),
                textos: [p.nombre, ...(SINONIMOS[p.slug] ?? []), cat?.name ?? '', sub?.name ?? ''].filter(Boolean),
            }];
        });
    }

    // Productos por slug, en ese orden (campañas y selecciones manuales de Josué)
    productosPorSlug(slugs: string[]): ProductoCategoria[] {
        return slugs
            .map(s => productos.find(p => p.slug === s))
            .filter((p): p is Producto => !!p)
            .map(p => this.aProducto(p));
    }

    // MOCK: los favoritos que elige y ordena Josué en el panel (Paso 19)
    favoritos(): ProductoCategoria[] {
        return ['doctor', 'bob-corazon-hombre', 'abogada', 'amigo-guitarrista', 'enfermera', 'homero']
            .map(s => productos.find(p => p.slug === s))
            .filter((p): p is Producto => !!p)
            .map(p => this.aProducto(p));
    }

    private ubicacion(p: Producto): [string, string | null] | undefined {
        return UBICACION[p.slug];
    }

    private aProducto(p: Producto): ProductoCategoria {
        const final = Math.round(p.precio * 100);
        const base = p.precioAnterior ? Math.round(p.precioAnterior * 100) : final;
        const precio: PrecioContrato = {
            currency: 'USD', base_cents: base, final_cents: final,
            discount_cents: base - final,
            discount_percent: base > final ? Math.round((1 - final / base) * 100) : 0,
            badge: base > final ? `${Math.round((1 - final / base) * 100)}% OFF` : null,
        };
        return { sku: `MOCK-${p.id}`, slug: p.slug, name: p.nombre, image: p.imagen, price: precio, available: p.disponible };
    }
}
