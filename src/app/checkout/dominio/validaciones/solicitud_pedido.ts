import { ItemCarrito } from '../../../carrito/aplicacion/servicios/CarritoService';
import { DatosCheckout } from '../../aplicacion/servicios/CheckoutService';
import { EntregaPedido } from '../interfaces/promesa';

// Versión de los términos que acepta la persona al confirmar (Laravel guarda cuál aceptó y cuándo).
export const VERSION_TERMINOS = '2026-11';

/** Cuerpo de POST /api/v1/checkout (contrato del Paso 0). Nombres en inglés y snake_case, idénticos a Laravel. */
export interface SolicitudPedido {
    items: {
        slug: string;
        personalization: { name_text: string; dedication: { mode: 'text' | 'none'; text: string } } | null;
        preview_image: string | null;
    }[];
    promise_token: string;
    expected_total_cents: number;
    expected_window: { start: string; end: string };
    shipping: {
        name: string; id_type: string; id_number: string; phone: string; email: string;
        province_code: string; canton_code: string; address: string; reference: string;
    };
    billing: { same_as_shipping: true } | {
        same_as_shipping: false; name: string; id_type: string; id_number: string; phone: string; email: string;
        province_code: string; canton_code: string; address: string;
    };
    contact: { same_as_shipping: true } | { same_as_shipping: false; phone: string };
    payment_method: 'transfer' | 'card';
    window_choice: { type: 'immediate' } | { type: 'scheduled'; start: string };
    terms: { accepted: true; version: string };
    tracking: Record<string, unknown> | null;
}

export interface CodigosUbicacion {
    provincia: (nombre: string) => string;
    canton: (provincia: string, nombre: string) => string;
}

export interface EntradaSolicitud {
    items: ItemCarrito[];
    datos: DatosCheckout;
    totalCentavos: number;
    entrega: EntregaPedido;
    tracking: Record<string, unknown> | null;
}

/**
 * Arma lo que se manda a Laravel. Solo traduce y copia: el precio, la ventana y la capacidad los decide Laravel;
 * `expected_total_cents` y `expected_window` solo le dicen qué vio la persona para que avise si algo cambió.
 */
export function armarSolicitud(e: EntradaSolicitud, codigos: CodigosUbicacion): SolicitudPedido {
    const d = e.datos;
    const otros = d.facturacion === 'otros';

    return {
        items: e.items.map(item => ({
            slug: String(item.producto.id),
            personalization: item.tipo === 'personalizado' && item.configuracion
                ? {
                    name_text: item.configuracion.nombre.trim(),
                    dedication: item.configuracion.sinTarjeta || !item.configuracion.dedicatoria.trim()
                        ? { mode: 'none', text: '' }
                        : { mode: 'text', text: item.configuracion.dedicatoria.trim() },
                }
                : null,
            preview_image: item.tipo === 'personalizado' && item.vista ? item.vista : null,
        })),
        promise_token: e.entrega.promise_token,
        expected_total_cents: e.totalCentavos,
        expected_window: e.entrega.window,
        shipping: {
            name: d.nombre, id_type: d.tipoDoc, id_number: d.cedula, phone: d.celular, email: d.correo,
            province_code: codigos.provincia(d.provincia), canton_code: codigos.canton(d.provincia, d.canton),
            address: d.direccion, reference: d.referencia,
        },
        billing: otros
            ? {
                same_as_shipping: false, name: d.fNombre, id_type: d.fTipoDoc, id_number: d.fCedula, phone: d.fCelular, email: d.fCorreo,
                province_code: codigos.provincia(d.fProvincia), canton_code: codigos.canton(d.fProvincia, d.fCanton), address: d.fDireccion,
            }
            : { same_as_shipping: true },
        contact: d.contacto === 'otro' ? { same_as_shipping: false, phone: d.contactoNumero } : { same_as_shipping: true },
        payment_method: d.metodoPago === 'payphone' ? 'card' : 'transfer',
        window_choice: e.entrega.tipo === 'programada' ? { type: 'scheduled', start: e.entrega.window.start } : { type: 'immediate' },
        terms: { accepted: true, version: VERSION_TERMINOS },
        tracking: e.tracking,
    };
}
