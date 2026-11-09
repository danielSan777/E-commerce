// Contrato del Paso 0: categoría con subcategorías (pantalla de categorías).
// Nombres en inglés y snake_case: son idénticos a la respuesta de Laravel. Dinero en centavos.
// Angular solo muestra estos campos; no calcula precios ni decide qué productos entran.

export interface PrecioContrato {
    currency: 'USD';
    base_cents: number;
    final_cents: number;
    discount_cents: number;
    discount_percent: number;
    badge: string | null;
}

export interface ProductoCategoria {
    sku: string;
    slug: string;
    name: string;
    image: string;
    price: PrecioContrato;
    available: boolean;
}

export interface SeoContrato {
    title: string;
    description: string;
    canonical: string;
    og_image: string;
}

export interface SubcategoriaContrato {
    slug: string;
    name: string;
    url: string;
    icon?: string;          // clase de Bootstrap Icons para la pestaña
    description?: string;   // texto bajo el nombre cuando la pestaña está activa
}

export interface CategoriaContrato {
    slug: string;
    name: string;
    headline: string;
    intro_html: string;
    hero?: { type: 'image' | 'video'; url: string; poster?: string };
    short_description: string;   // una línea para las tarjetas de /categorias
    price_from_cents: number;
    subcategories: SubcategoriaContrato[];
    active_subcategory: string | null;
    products: ProductoCategoria[];
    seo: SeoContrato;
}

// Resumen para las tarjetas de las 4 categorías de arriba
export interface CategoriaResumen {
    slug: string;
    name: string;
    url: string;
    image: string;
    description: string;
}

// Producto de GET /api/v1/products (todos, favoritos y búsqueda): el resumen más categoría, subcategoría y palabras de búsqueda.
export interface ProductoListado extends ProductoCategoria {
    category: { slug: string; name: string };
    subcategory: { slug: string; name: string } | null;
    search_terms: string[];
}
