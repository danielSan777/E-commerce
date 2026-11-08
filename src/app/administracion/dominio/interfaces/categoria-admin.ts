// Contrato de la API de administración de categorías: GET/POST/PUT /api/v1/admin/categories
export interface CategoriaAdmin {
  slug: string;
  name: string;
  headline: string | null;
  intro_html: string | null;
  sort_order: number;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  products_count: number;
  subcategories_count: number;
  updated_at: string;
}

export interface DatosCategoria {
  name: string;
  slug?: string;
  headline: string | null;
  intro_html: string | null;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
  is_active: boolean;
}

// Contrato: GET/POST/PUT/DELETE /api/v1/admin/categories/{categoria}/subcategories
export interface SubcategoriaAdmin {
  slug: string;
  name: string;
  category_slug: string;
  sort_order: number;
  is_active: boolean;
  products_count: number;
}

export interface DatosSubcategoria {
  name: string;
  sort_order: number;
  is_active: boolean;
}
