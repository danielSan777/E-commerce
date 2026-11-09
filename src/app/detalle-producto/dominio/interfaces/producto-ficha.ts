// Contrato de la ficha: GET /api/v1/products/{slug}. Nombres iguales a los de Laravel; dinero en centavos.
// Angular solo muestra estos campos: el precio final y el descuento los calcula Laravel.
import { PrecioContrato, SeoContrato } from '../../../categorias/dominio/interfaces/categoria';

export interface MedioFicha {
  type: 'image' | 'video';
  role?: string;
  alt?: string | null;
  srcset?: Record<string, string>;   // {"600": url, "1080": url}
  url?: string;                      // solo en videos
  poster?: string | null;            // solo en videos: imagen que se ve mientras carga
  duration_s?: number | null;        // solo en videos
}

export interface ProductoFicha {
  sku: string;
  slug: string;
  type: 'personalizable' | 'complemento';
  name: string;
  category: { slug: string; name: string };
  subcategory: { slug: string; name: string } | null;
  available: boolean;
  price: PrecioContrato;
  size_text: string | null;
  material_text: string | null;
  includes: string[];
  description_html: string | null;
  media: MedioFicha[];
  related_skus: string[];
  seo: SeoContrato;
}
