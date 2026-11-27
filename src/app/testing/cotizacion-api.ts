import { CotizacionCarrito } from '../carrito/aplicacion/servicios/CotizacionService';

/** Respuesta de Laravel para una maceta de $20,00 con envío de $3,50 y recargo de tarjeta de 6 %: lo que se vería en modo estándar. */
export const COTIZACION_API: CotizacionCarrito = {
  mode: 'standard', subtotal_cents: 2000, discount_cents: 0, merchandise_value_cents: 2000, discounted_lines: [], free_shipping: false,
  shipping_cents: 350, card_fee_cents: 141, total_transfer_cents: 2350, total_card_cents: 2491, shipping_available: true,
};

export const cotizacionApi = (cambios: Partial<CotizacionCarrito> = {}): CotizacionCarrito => ({ ...COTIZACION_API, ...cambios });
