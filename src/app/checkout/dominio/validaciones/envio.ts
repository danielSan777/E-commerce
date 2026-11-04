import { buscarCanton, buscarSector } from '../ubicaciones';
import tablaZonas from '../datos/zonas-envio.json';

/*
 * Zona y costo de envío según el cantón que el comprador eligió (códigos del INEC).
 * La zona de cada cantón está en dominio/datos/zonas-envio.json (tarifas reales de Servientrega).
 *
 *   Zona A: Servientrega cobra $2.59 (Guayaquil, Daule, Durán, Samborondón, Salitre) ....... $3.50
 *   Zona B: Amazonía y destinos que Servientrega cobra igual, $7.02 (+1 día) ............... $6.25
 *   Zona C: resto del país continental, Servientrega $5.29 o $5.92 ......................... $5.00
 *   no_disponible: Galápagos, Taisha y Aguarico (se atiende por WhatsApp)
 *
 * Prioridad: sector (sectores-zona-a.json) > cantón (zonas-envio.json) > Zona B de respaldo (la más cara).
 */

// ===== EDITABLES =====
export const TARIFAS_ENVIO = { A: 3.5, B: 6.25, C: 5 } as const;

// La tarifa más baja, para "Envío desde $3,50 según destino" en la ficha de producto.
export const ENVIO_DESDE = Math.min(...Object.values(TARIFAS_ENVIO));

export const MENSAJE_SIN_ENVIO = 'Por ahora no enviamos a esta zona desde la web. Escríbenos por WhatsApp y lo coordinamos.';

export type ZonaEnvio = 'A' | 'B' | 'C' | 'no_disponible';

const ZONA_POR_CANTON = new Map(tablaZonas.cantones.map(c => [c.codigo, c.zona as ZonaEnvio]));

export function zonaEnvio(provincia: string, canton: string): ZonaEnvio {
    if (buscarSector(provincia, canton)) return 'A';
    const cant = buscarCanton(provincia, canton);
    return (cant && ZONA_POR_CANTON.get(cant.codigo)) || 'B';
}

export function envioDisponible(provincia: string, canton: string): boolean {
    return zonaEnvio(provincia, canton) !== 'no_disponible';
}

// Zona B suma 1 día a la ventana de entrega.
export function tieneDiaAdicional(provincia: string, canton: string): boolean {
    return zonaEnvio(provincia, canton) === 'B';
}

export function costoEnvio(provincia: string, canton: string): number {
    const zona = zonaEnvio(provincia, canton);
    return zona === 'no_disponible' ? 0 : TARIFAS_ENVIO[zona];
}
