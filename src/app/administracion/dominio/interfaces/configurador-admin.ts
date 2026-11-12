import { ExcepcionApi, GeometriaApi, UbicacionApi } from '../../../personalizador/dominio/configurador';

export type ComportamientoAccesorioAdmin = 'lentes' | 'gafas' | 'marco_foto' | 'marco_frase';

export interface CategoriaAccesorioAdmin {
  id: number;
  name: string;
  sort_order: number;
  accessories_count: number;
}

export interface AccesorioAdmin {
  id: number;
  name: string;
  type: 'imagen' | 'texto';
  behavior: ComportamientoAccesorioAdmin | null;
  text: string | null;
  category_id: number;
  category: string | null;
  image: string | null;
  thumb: string | null;
  alt: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface DatosAccesorio {
  name: string;
  accessory_category_id: number;
  type: 'imagen' | 'texto';
  behavior: ComportamientoAccesorioAdmin | null;
  default_text: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface UbicacionAdmin {
  id: number;
  name: string;
  sort_order: number;
  allowed_category_ids: number[];
  allowed_categories: string[];
  excluded_category_ids: number[];
  excluded_categories: string[];
}

export interface DatosUbicacion {
  name: string;
  sort_order: number;
  allowed_category_ids: number[];
  excluded_category_ids: number[];
}

/** Lo que se guarda: ubicaciones con su estado y valores, accesorios marcados y excepciones. */
export interface ConfigGuardableAdmin {
  locations: {
    location_id: number;
    state: 'libre' | 'fija' | 'deshabilitada';
    priority: number;
    layer: number;
    fixed_accessory_id: number | null;
    preset: GeometriaApi | null;
  }[];
  accessory_ids: number[];
  exceptions: ExcepcionApi[];
}

/** Lo que devuelve Laravel al leer una configuración (las ubicaciones traen su nombre y sus reglas de categoría). */
/** Encuadre de la foto de un producto: escala en % (100 = igual) y desplazamiento en % del visor. */
export interface AjusteImagenAdmin {
  scale: number;
  x: number;
  y: number;
}

export interface ConfigLeidaAdmin {
  locations: UbicacionApi[];
  accessory_ids: number[];
  exceptions: ExcepcionApi[];
}

export interface ConfiguracionDeCategoriaAdmin {
  scope: 'category';
  slug: string;
  name: string;
  has_config: boolean;
  products: { sku: string; name: string; uses_own_configurator: boolean; base_image: string | null; base_adjust: AjusteImagenAdmin }[];
  config: ConfigLeidaAdmin;
}

export interface ConfiguracionDeProductoAdmin {
  scope: 'product';
  sku: string;
  name: string;
  category_slug: string | null;
  category_name: string | null;
  uses_own_configurator: boolean;
  source: 'product' | 'category';
  has_config: boolean;
  /** Imagen para personalizar de este producto; null si aún no la tiene. */
  base_image: string | null;
  base_adjust: AjusteImagenAdmin;
  config: ConfigLeidaAdmin;
}
