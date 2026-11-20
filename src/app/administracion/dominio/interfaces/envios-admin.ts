export type CodigoZona = 'A' | 'B' | 'C' | 'no_disponible';

export interface ZonaAdmin {
  code: CodigoZona; name: string; price_cents: number; extra_days: number; is_available: boolean; cantons_count: number;
}

export interface CantonAdmin {
  code: string; name: string; is_locality: boolean; province_code: string; province_name: string; zone: CodigoZona;
}

export interface DatosZona { price_cents: number; extra_days: number; is_available: boolean }
