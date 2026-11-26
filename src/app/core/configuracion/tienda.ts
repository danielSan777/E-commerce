// ===== EDITABLE: datos de contacto de la tienda — UN SOLO LUGAR =====
// Cámbialos aquí y se actualizan en el pie de página, la barra superior, el botón de WhatsApp, el pedido
// pendiente y los mensajes de WhatsApp. (Más adelante estos valores vendrán de `settings` en Laravel.)
export const TIENDA = {
    nombre: 'Jardín de Sele',

    /** Correo de contacto (el mismo de los términos y condiciones). */
    correo: 'ayuda@jardindesele.com',

    /** Teléfono como se ve en pantalla. */
    telefono: '+593 999283765',

    /** WhatsApp con código de país y SOLO dígitos (sin +, espacios ni guiones). */
    whatsapp: '593999283765',

    /** Mensaje que aparece escrito al abrir el chat desde el pie de página y el botón flotante. */
    mensajeWhatsapp: 'Hola, quisiera más información sobre sus productos.',
} as const;

/** Quién envía los paquetes: sale como «Remitente» en la etiqueta de envío del panel. */
export const REMITENTE = {
    nombre: 'Josué de Santis Alvarado',
    /** RUC como va impreso en la etiqueta. */
    ruc: '0930247994-001',
} as const;

/** Enlace a un chat de WhatsApp de la tienda con un texto ya escrito. */
export function enlaceWhatsapp(texto: string = TIENDA.mensajeWhatsapp): string {
    return `https://wa.me/${TIENDA.whatsapp}?text=${encodeURIComponent(texto)}`;
}

/**
 * Seguimiento (Paso 20). Son identificadores públicos (no secretos): van en el navegador. Los tokens y secretos de Meta, TikTok y GA4
 * van solo en el `.env` de Laravel. Vacío = ese servicio queda apagado.
 */
export const SEGUIMIENTO = {
    /** ID del contenedor de Google Tag Manager. GTM reparte los eventos a GA4, Meta y TikTok. Solo se carga si el visitante acepta las cookies. */
    gtmId: 'GTM-KSG39B86',
} as const;
