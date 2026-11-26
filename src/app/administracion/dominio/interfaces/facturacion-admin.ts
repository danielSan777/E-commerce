export interface DatosDeFactura {
  name: string;
  id_type: 'cedula' | 'ruc' | string;
  id_number: string;
  email: string;
  phone: string;
  address: string;
  province: string;
  canton: string;
  same_as_shipping: 'yes' | 'no';
}

export interface PedidoPorFacturar {
  number: string;
  channel: string;
  payment_method: string;
  paid_at: string | null;
  subtotal_cents: number;
  discount_cents: number;
  shipping_cents: number;
  card_fee_cents: number;
  total_cents: number;
  items: { name: string; quantity: number; line_total_cents: number }[];
  invoice_to: DatosDeFactura;
  invoiced_at: string | null;
  invoice_number: string | null;
}

export interface ListaPorFacturar {
  data: PedidoPorFacturar[];
  meta: { pending_count: number };
}

export interface ResultadoDeFacturado {
  results: { number: string; ok: boolean; message: string | null }[];
  invoiced: number;
}
