// Contrato: GET/POST/PUT/DELETE /api/v1/admin/products (dinero siempre en centavos enteros)
export interface ProductoAdmin {
  sku: string;
  slug: string;
  name: string;
  type: 'personalizable' | 'complemento';
  category_slug: string;
  category_name: string;
  subcategory_slug: string | null;
  base_price_cents: number;
  cost_cents: number | null;
  discount_percent: number;
  discount_cents: number;
  final_price_cents: number;
  size_text: string | null;
  material_text: string | null;
  includes: string[];
  description_html: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_available: boolean;
  is_active: boolean;
  /** Imagen para personalizar (obligatoria en los personalizables); null si aún no se sube. */
  personalization_image: string | null;
  search_synonyms: string[];
  updated_at: string;
}

export interface DatosProducto {
  name: string;
  type: 'personalizable' | 'complemento';
  category: string;
  subcategory: string;
  base_price_cents: number;
  cost_cents: number | null;
  discount_percent: number;
  size_text: string | null;
  material_text: string | null;
  includes: string[];
  description_html: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_available: boolean;
  is_active: boolean;
}

/** GET /admin/products/price-preview: el cálculo lo hace Laravel (Angular solo lo muestra). */
export interface PrevisualizacionPrecio {
  base_price_cents: number;
  discount_percent: number;
  discount_cents: number;
  final_price_cents: number;
}
