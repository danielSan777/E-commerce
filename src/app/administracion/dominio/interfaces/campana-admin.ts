// Contrato de la API de administración de campañas: GET/POST/PUT/DELETE /api/v1/admin/campaigns
export interface CampanaAdmin {
  slug: string;
  name: string;
  related_category: { slug: string; name: string };
  start_md: string;   // "MM-DD": se repite cada año
  end_md: string;
  event_md: string;
  tagline: string | null;
  slogan: string | null;
  theme_color: string | null;   // "#C2185B"; null = el color de siempre
  emoji: string | null;
  cover_url: string | null;     // portada: la primera imagen de la campaña
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  products: { sku: string; slug: string; name: string }[];   // en el orden elegido
  state: 'active' | 'upcoming';   // lo calcula Laravel con la fecha de hoy en Guayaquil
  season_year: number;
  updated_at: string;
}

export interface DatosCampana {
  name: string;
  related_category: string;   // slug
  start_md: string;
  end_md: string;
  event_md: string;
  tagline: string | null;
  slogan: string | null;
  theme_color: string | null;
  emoji: string | null;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  products: string[];         // SKU en el orden elegido
}
