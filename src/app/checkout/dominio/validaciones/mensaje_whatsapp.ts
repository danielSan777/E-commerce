import { Pedido } from '../../aplicacion/servicios/PedidoService';

// ===== EDITABLE =====
// Número de WhatsApp de la tienda, con código de país y sin "+" ni espacios (el del pie de página: +593 999283765)
export const WHATSAPP_TIENDA = '593999283765';

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

/** Celular de contacto: el que escribió como "otro número" o, si usa el mismo, el celular de la información de envío. */
export function telefonoContacto(p: Pedido): string {
    const d = p.datos;
    if (d.contacto === 'otro') return `${d.contactoNumero}`.trim();
    return d.celular;
}

/** Datos que el cliente tendrá que enviar después por WhatsApp (tarjeta, foto o frase del marco). */
export function pendientesPorWhatsapp(p: Pedido): string[] {
    const lista: string[] = [];

    for (const item of p.items) {
        const c = item.configuracion;
        if (!c) continue;

        if (c.tarjetaPorWhatsapp && !lista.includes('Tarjeta de dedicatoria')) lista.push('Tarjeta de dedicatoria');

        if (c.marcoPorWhatsapp) {
            const ids = (c.accesorios ?? []).map(a => a.accesorioId);
            const texto = ids.includes(3) ? 'Foto del marco' : ids.includes(4) ? 'Frase del marco' : 'Foto o frase del marco';
            if (!lista.includes(texto)) lista.push(texto);
        }
    }

    return lista;
}

/** Mensaje corto que se muestra en pantalla. */
export function mensajeCorto(p: Pedido): string {
    return `Hola, quiero confirmar el pago de mi pedido ${p.numero}. Haré mi pago por transferencia y enviaré mi comprobante aquí mismo.`;
}

/** Mensaje completo que se manda por WhatsApp: pedido, cliente, entrega, facturación, productos con sus detalles y totales. */
export function mensajeCompleto(p: Pedido): string {
    const d = p.datos;
    const L: string[] = [];

    L.push(mensajeCorto(p));
    L.push('');
    L.push(`*PEDIDO ${p.numero}*`);
    L.push(`Fecha: ${fechaLarga(p.fecha)}`);
    L.push('');

    L.push('*Cliente*');
    L.push(`Nombre: ${d.nombre}`);
    L.push(`${d.tipoDoc === 'ruc' ? 'RUC' : 'Cédula'}: ${d.cedula}`);
    L.push(`Celular: ${d.celular}`);
    L.push(`Correo: ${d.correo}`);
    L.push(`Celular de contacto: ${telefonoContacto(p)}`);
    L.push('');

    L.push('*Entrega*');
    L.push(`Provincia: ${d.provincia}`);
    L.push(`Ciudad: ${d.ciudad}`);
    L.push(`Dirección: ${d.direccion}`);
    if (d.referencia.trim()) L.push(`Referencia: ${d.referencia}`);
    L.push('');

    L.push('*Productos*');
    p.items.forEach((item, i) => {
        L.push(`${i + 1}. ${item.producto.nombre} — ${dinero(item.producto.precio)}`);
        for (const linea of item.resumen ?? []) {
            L.push(`   • ${linea.etiqueta}: ${linea.valor}`);
        }
    });
    L.push('');

    L.push(`Subtotal: ${dinero(p.subtotal)}`);
    L.push(`Envío: ${p.envioGratis ? 'Gratis' : dinero(p.envio)}`);
    if (p.recargo > 0) L.push(`Recargo PayPhone: ${dinero(p.recargo)}`);
    L.push(`*Total a pagar: ${dinero(p.total)}*`);
    L.push(`Método de pago: ${p.metodo === 'payphone' ? 'Tarjeta con PayPhone' : 'Transferencia bancaria'}`);

    const pendientes = pendientesPorWhatsapp(p);
    if (pendientes.length) {
        L.push('');
        L.push(`Te enviaré por aquí: ${pendientes.join(', ')}.`);
    }

    return L.join('\n');
}

export function urlWhatsapp(p: Pedido): string {
    return `https://wa.me/${WHATSAPP_TIENDA}?text=${encodeURIComponent(mensajeCompleto(p))}`;
}