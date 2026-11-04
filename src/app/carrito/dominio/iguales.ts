import { ItemCarrito } from '../aplicacion/servicios/CarritoService';

// Huella de una maceta personalizada: mismo modelo, nombre, gafas, accesorios, frase o foto y dedicatoria
export function huellaMaceta(item: ItemCarrito): string {
  const c = item.configuracion;
  return JSON.stringify([
    item.producto.id,
    c?.nombre.trim() ?? '',
    c?.colorLentes ?? '',
    c?.colorGafas ?? '',
    (c?.accesorios ?? []).map(a => a.accesorioId).sort((a, b) => a - b),
    c?.textoMarco.trim() ?? '',
    c?.fotoMarcoNombre ?? '',
    c?.dedicatoria.trim() ?? '',
    c?.sinTarjeta ?? false,
  ]);
}

// La maceta que hay que confirmar: igual a otra anterior y que el comprador todavía no confirmó
export function macetaIgualSinConfirmar(items: ItemCarrito[]): ItemCarrito | undefined {
  const vistas = new Set<string>();
  for (const item of items) {
    if (item.tipo !== 'personalizado') continue;
    const huella = huellaMaceta(item);
    if (vistas.has(huella) && !item.igualConfirmada) return item;
    vistas.add(huella);
  }
  return undefined;
}
