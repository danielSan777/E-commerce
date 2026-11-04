// ===== EDITABLE: datos de contacto de la tienda — UN SOLO LUGAR =====
// Cámbialos aquí y se actualizan en el pie de página, la barra superior, el botón de WhatsApp, el pedido
// pendiente y los mensajes de WhatsApp. (Más adelante estos valores vendrán de `settings` en Laravel.)
export const TIENDA = {
    nombre: 'Jardín de Sele',

    /** Correo de contacto. Hoy es un correo de ejemplo: reemplázalo por el real. */
    correo: 'info@Jardín de Sel.com',

    /** Teléfono como se ve en pantalla. */
    telefono: '+593 999283765',

    /** WhatsApp con código de país y SOLO dígitos (sin +, espacios ni guiones). */
    whatsapp: '593999283765',

    /** Mensaje que aparece escrito al abrir el chat desde el pie de página y el botón flotante. */
    mensajeWhatsapp: 'Hola, quisiera más información sobre sus productos.',
} as const;

/** Enlace a un chat de WhatsApp de la tienda con un texto ya escrito. */
export function enlaceWhatsapp(texto: string = TIENDA.mensajeWhatsapp): string {
    return `https://wa.me/${TIENDA.whatsapp}?text=${encodeURIComponent(texto)}`;
}
