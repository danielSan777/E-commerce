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
    image: string;
    subcategorias: { slug: string; name: string }[];
}

// Subcategorías iniciales de Profesiones y Hobbies (Paso 6). Las de Amor, Amistad y Familia las define Josué:
// mientras no existan, la categoría se muestra sin pestañas.
const CATEGORIAS: DatosCategoria[] = [
    {
        slug: 'profesiones-y-hobbies', name: 'Profesiones y Hobbies',
        headline: 'Un detalle para quien ama lo que hace',
        intro: 'Macetas personalizadas para celebrar una profesión, una graduación o un hobby, con su nombre y su plantita natural.',
        image: 'imagenes/profesionales/doctor.png',
        subcategorias: [
            { slug: 'salud', name: 'Salud' },
            { slug: 'administrativos', name: 'Administrativos' },
            { slug: 'fuerza-publica', name: 'Fuerza Pública' },
            { slug: 'cocina-y-hobbies', name: 'Cocina y Hobbies' },
        ],
    },
    {
        slug: 'amor', name: 'Amor',
        headline: 'Dile lo que sientes con un detalle que crece',
        intro: 'Regalos para parejas y enamorados, personalizados con su nombre y una dedicatoria.',
        image: 'imagenes/amor-amistad/Bob corazón Hombre.png', subcategorias: [],
    },
    {
        slug: 'amistad', name: 'Amistad',
        headline: 'Para ese amigo que siempre está',
        intro: 'Macetas con personajes y detalles para sorprender a tus amigos en su cumpleaños o sin motivo.',
        image: 'imagenes/amor-amistad/Amigo-guitarrista.png', subcategorias: [],
    },
    {
        slug: 'familia', name: 'Familia',
        headline: 'Un regalo para los tuyos',
        intro: 'Detalles para mamá, papá, hermanos y abuelos, hechos a su medida.',
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

// MOCK (Paso 0): devuelve la forma exacta que entregará Laravel para categoría con subcategorías. Con backend solo
// cambia el cuerpo de estos métodos por la llamada a la API; la pantalla no se toca.
@Injectable({ providedIn: 'root' })
export class CategoriaService {

    categorias(): CategoriaResumen[] {
        return CATEGORIAS.map(c => ({ slug: c.slug, name: c.name, url: `/${c.slug}`, image: c.image }));
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
            slug: s.slug, name: s.name, url: `/${datos!.slug}/${s.slug}`,
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
