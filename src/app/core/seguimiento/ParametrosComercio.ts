import type { ItemCarrito } from '../../carrito/aplicacion/servicios/CarritoService';
import type { CotizacionCarrito } from '../../carrito/aplicacion/servicios/CotizacionService';

/** Lo que Laravel entrega para avisar una compra (`analytics` del checkout y de la confirmación con tarjeta). Dinero en centavos. */
export interface DatosDeCompra {
    event_id: string;
    transaction_id: string;
    value_cents: number;
    currency: string;
    items: { sku: string; name: string; price_cents: number; quantity: number }[];
}

export interface ItemEvento { item_id: string; item_name: string; price: number; quantity: number }

// Angular no calcula dinero: aquí solo se pasa de centavos (lo que entrega Laravel) a dólares, que es como Meta, TikTok y GA4 reciben el valor.
const aDolares = (centavos: number): number => centavos / 100;

/** Una línea para los eventos del embudo; `precio` ya viene en dólares tal como lo muestra la tienda. */
export function itemEvento(sku: string, nombre: string, precio: number): ItemEvento {
    return { item_id: sku, item_name: nombre, price: precio, quantity: 1 };
}

/** view_item y add_to_cart: el valor es el precio que Laravel publicó para ese producto. */
export function parametrosDeProducto(sku: string, nombre: string, precio: number): Record<string, unknown> {
    return { currency: 'USD', value: precio, items: [itemEvento(sku, nombre, precio)] };
}

/**
 * begin_checkout y add_payment_info: el valor lo da la cotización de Laravel (productos netos de descuento, sin envío ni recargo).
 * Si la cotización todavía no llegó, no se manda valor: es mejor un evento sin valor que uno inventado aquí.
 */
export function parametrosDeCarrito(items: ItemCarrito[], cotizacion: CotizacionCarrito | null): Record<string, unknown> {
    const lineas = items.map(i => itemEvento(i.producto.sku ?? String(i.producto.id), i.producto.nombre, i.producto.precio));
    return cotizacion ? { currency: 'USD', value: aDolares(cotizacion.merchandise_value_cents), items: lineas } : { items: lineas };
}

/** purchase y place_order: todo viene de Laravel, con el mismo `event_id` que usa el servidor para que no se cuente doble. */
export function parametrosDeCompra(d: DatosDeCompra): Record<string, unknown> {
    return {
        event_id: d.event_id,
        transaction_id: d.transaction_id,
        currency: d.currency,
        value: aDolares(d.value_cents),
        items: d.items.map(i => ({ item_id: i.sku, item_name: i.name, price: aDolares(i.price_cents), quantity: i.quantity })),
    };
}
