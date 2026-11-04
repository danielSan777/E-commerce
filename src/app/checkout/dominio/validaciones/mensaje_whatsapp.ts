import { Pedido } from '../../aplicacion/servicios/PedidoService';

import { enlaceWhatsapp } from '../../../core/configuracion/tienda';   // el número se cambia allí (un solo lugar)

const MESES = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];

export function dinero(valor: number): string {
    return `$${valor.toFixed(2)}`;
}

/** "18 de mar. 2025 a las 16:32" */
export function fechaLarga(iso: string): string {
    const d = new Date(iso);
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${d.getDate()} de ${MESES[d.getMonth()]} ${d.getFullYear()} a las ${hora}:${min}`;
}

const MAX_PRODUCTOS_EN_MENSAJE = 3;

/**
 * Mensaje para enviar el comprobante por WhatsApp. Es corto a propósito: número de pedido, total y hasta 3 productos.
 * No lleva datos personales ni la dirección (esos ya los tiene el pedido).
 */
export function mensajeComprobante(p: Pedido): string {
    const L: string[] = [`Hola 🌿 Te envío el comprobante de mi pedido ${p.numero}.`, `Total: ${dinero(p.total)}`];

    const visibles = p.items.slice(0, MAX_PRODUCTOS_EN_MENSAJE);
    for (const item of visibles) L.push(`• ${item.producto.nombre}`);

    const faltan = p.items.length - visibles.length;
    if (faltan > 0) L.push(`• y ${faltan} más`);

    return L.join('\n');
}

export function urlWhatsapp(p: Pedido): string {
    return enlaceWhatsapp(mensajeComprobante(p));
}
