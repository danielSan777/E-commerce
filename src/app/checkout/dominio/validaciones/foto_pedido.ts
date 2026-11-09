import { ItemCarrito } from '../../../carrito/aplicacion/servicios/CarritoService';

/** Productos del pedido que tienen la foto de la maceta ya personalizada (data URL guardada al personalizar). */
export function itemsConFoto(items: ItemCarrito[]): ItemCarrito[] {
    return items.filter(i => i.vista.startsWith('data:image/'));
}

/** "jardin-de-sele-JDS-25989-amigo-guitarrista.jpg" (con número si hay varios productos con el mismo nombre). */
export function nombreArchivoFoto(numeroPedido: string, item: ItemCarrito, posicion: number): string {
    const nombre = item.producto.nombre
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const extension = item.vista.startsWith('data:image/png') ? 'png' : item.vista.startsWith('data:image/webp') ? 'webp' : 'jpg';
    return `jardin-de-sele-${numeroPedido}-${nombre || 'producto'}${posicion > 1 ? `-${posicion}` : ''}.${extension}`;
}
