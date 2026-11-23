export type CodigoZona = 'A' | 'B' | 'C' | 'no_disponible';

export interface ZonaAdmin {
  code: CodigoZona; name: string; price_cents: number; extra_days: number; is_available: boolean; cantons_count: number;
}

export interface CantonAdmin {
  code: string; name: string; is_locality: boolean; province_code: string; province_name: string; zone: CodigoZona;
}

export interface DatosZona { price_cents: number; extra_days: number; is_available: boolean }

/** Modo de venta: `standard` (envío por zona, gratis desde 2 macetas, con recargo por tarjeta) o `free_shipping_discount` (todo con envío gratis, sin recargo y con descuento en todas las macetas menos la de mayor valor). */
export type ModoVenta = 'standard' | 'free_shipping_discount';

export interface AjusteModoVenta {
    mode: ModoVenta;
    discount_percent: number;
    card_surcharge_percent: number;
    free_shipping_min_planters: number;
}
