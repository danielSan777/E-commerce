import { VistaPrevia } from '../interfaces/pedido_pendiente';

/** Etiquetas para que WhatsApp, Facebook y demás muestren una tarjeta con foto al pegar el enlace /pedido/{token}. */
export function etiquetasDeVistaPrevia(v: VistaPrevia): { property?: string; name?: string; content: string }[] {
    const etiquetas: { property?: string; name?: string; content: string }[] = [
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Jardín de Sele' },
        { property: 'og:title', content: v.title },
        { property: 'og:description', content: v.description },
        { name: 'description', content: v.description },
        { name: 'twitter:card', content: v.image ? 'summary_large_image' : 'summary' },
        { name: 'twitter:title', content: v.title },
        { name: 'twitter:description', content: v.description },
    ];
    if (v.image) {
        etiquetas.push({ property: 'og:image', content: v.image }, { name: 'twitter:image', content: v.image });
    }
    return etiquetas;
}
