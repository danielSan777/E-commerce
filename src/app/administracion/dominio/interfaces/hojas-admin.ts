export interface CabeceraCiclo {
  date: string;
  dispatch_date: string;
  window: { start: string; end: string };
}

export interface ItemDeHoja {
  id: number;
  name: string;
  type: 'personalizable' | 'complemento' | string;
  quantity: number;
  plate_text: string | null;       // el texto exacto de la placa (con tildes y ñ)
  lens_color: string | null;
  glasses_color: string | null;
  accessories: string[];
  frame_text: string | null;
  has_frame_photo: boolean;
  dedication: string | null;
}

export interface PedidoDeHoja {
  number: string;
  channel: string;
  payment_method: string;
  payment_status: string;
  status: string;
  zone: string;
  extra_days: number;              // Amazonía: 1
  window: { start: string; end: string };
  scheduled: boolean;
  planters: number;
  items: ItemDeHoja[];
}

export interface HojaDeProduccion {
  cycle: CabeceraCiclo;
  orders: PedidoDeHoja[];
  totals: { orders: number; planters: number };
}

export interface PedidoParaEnvio {
  number: string;
  status: string;                  // in_production | shipped
  name: string;
  id_type: 'cedula' | 'ruc' | string;
  id_number: string;
  phone: string;
  province: string;
  canton: string;
  address: string;
  reference: string;
  window: { start: string; end: string };
  tracking_number: string | null;
}

export interface ListaDeEnvios {
  cycle: CabeceraCiclo;
  orders: PedidoParaEnvio[];
}

export interface ResultadoDeLote {
  results: { number: string; ok: boolean; message: string | null }[];
  shipped: number;
}
