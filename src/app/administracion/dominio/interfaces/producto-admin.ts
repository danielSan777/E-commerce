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
  size_text: string | null;
  material_text: string | null;
  includes: string[];
  description_html: string | null;
  is_available: boolean;
  is_active: boolean;
  search_synonyms: string[];
  updated_at: string;
}

export interface DatosProducto {
  name: string;
  sku?: string;
  type: 'personalizable' | 'complemento';
  category: string;
  subcategory: string | null;
  base_price_cents: number;
  cost_cents: number | null;
  size_text: string | null;
  material_text: string | null;
  includes: string[];
  description_html: string | null;
  is_available: boolean;
  is_active: boolean;
}
