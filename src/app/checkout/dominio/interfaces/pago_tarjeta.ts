/** Datos de la Cajita de PayPhone que entrega Laravel (montos en centavos). Solo existen con PayPhone real. */
export interface CajitaPayphone {
  token: string;
  store_id: string;
  css_url: string;
  js_url: string;
  client_transaction_id: string;
  amount: number;
  amount_without_tax: number;
  currency: string;
  reference: string;
  email?: string;
  phone_number?: string;
  document_id?: string;
  identification_type: number;
  lang: string;
  time_zone: number;
}

/** Un intento de pago: la Cajita (real) o el modo de pruebas (simulated, nunca en producción). */
export interface IntentoDePago {
  client_transaction_id: string;
  expires_at: string;
  simulated: boolean;
  box: CajitaPayphone | null;
}

export type ResultadoDelPago = 'approved' | 'declined' | 'error' | 'review';

export interface RespuestaDelPago {
  result: ResultadoDelPago;
  message: string;
  simulated: boolean;
  order_number: string;
  token: string | null;     // solo con pago aprobado
  event_id: string | null;
}
