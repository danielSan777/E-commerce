import { buscarCanton, buscarLocalidad, buscarProvincia } from '../ubicaciones';

/*
 * Zona y costo de envío según la provincia y el cantón que el comprador eligió (códigos del INEC).
 *
 *   Zona A: Guayaquil, Durán y Samborondón ........ $3.50
 *   Zona B: provincias de la Amazonía ............. $6.25
 *   Zona C: el resto del país continental ......... $5.00
 *   Galápagos ..................................... no hay envío
 *
 * Prioridad de asignación: localidad > cantón > provincia > Zona C. Localidades con zona propia:
 * La Aurora, La Joya y Villa Club (Daule) son Zona A (dominio/datos/localidades.json).
 *
 * (El envío gratis por 2 macetas lo decide EnvioGratisService; aquí solo está la tarifa.)
 */

// ===== EDITABLES =====
export const ENVIO_LOCAL = 3.5;
export const ENVIO_AMAZONIA = 6.25;
export const ENVIO_RESTO = 5;

// Códigos del INEC
const CANTONES_ZONA_A = ['0901', '0907', '0916'];                         // Guayaquil, Durán, Samborondón
const PROVINCIAS_AMAZONIA = ['14', '15', '16', '19', '21', '22'];        // Morona Santiago, Napo, Pastaza, Zamora Chinchipe, Sucumbíos, Orellana
const PROVINCIA_GALAPAGOS = '20';

export const MENSAJE_GALAPAGOS = 'Actualmente no realizamos envíos a Galápagos.';

export type ZonaEnvio = 'local' | 'amazonia' | 'resto' | 'no_disponible';

export function zonaEnvio(provincia: string, canton: string, localidad = ''): ZonaEnvio {
    const prov = buscarProvincia(provincia);
    if (prov?.codigo === PROVINCIA_GALAPAGOS) return 'no_disponible';

    const sector = localidad ? buscarLocalidad(provincia, canton, localidad) : undefined;
    if (sector) return sector.zona;

    const cant = buscarCanton(provincia, canton);
    if (cant && CANTONES_ZONA_A.includes(cant.codigo)) return 'local';

    if (prov && PROVINCIAS_AMAZONIA.includes(prov.codigo)) return 'amazonia';

    return 'resto';
}

export function envioDisponible(provincia: string, canton: string, localidad = ''): boolean {
    return zonaEnvio(provincia, canton, localidad) !== 'no_disponible';
}

// En Galápagos no hay tarifa: devuelve 0 y la pantalla bloquea el pedido con envioDisponible().
export function costoEnvio(provincia: string, canton: string, localidad = ''): number {
    switch (zonaEnvio(provincia, canton, localidad)) {
        case 'local': return ENVIO_LOCAL;
        case 'amazonia': return ENVIO_AMAZONIA;
        case 'no_disponible': return 0;
        default: return ENVIO_RESTO;
    }
}
