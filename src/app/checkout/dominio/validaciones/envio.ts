import { normalizar } from './validaciones';

/*
 * Costo de envío según la ciudad y la provincia que el cliente eligió.
 *
 *   Guayaquil, Durán y Samborondón ........ $3.50
 *   Ciudades de la Amazonía ............... $6.25
 *   Todo lo demás ......................... $5.00
 *
 * (El envío gratis por 2 macetas lo decide EnvioGratisService; aquí solo está la tarifa.)
 */

// ===== EDITABLES =====
export const ENVIO_LOCAL = 3.5;
export const ENVIO_AMAZONIA = 6.25;
export const ENVIO_RESTO = 5;

// Ciudades con tarifa local (se comparan sin tildes ni mayúsculas)
const CIUDADES_LOCALES = ['guayaquil', 'duran', 'samborondon'];

// Provincias de la Amazonía (se comparan por el comienzo del nombre, así "Morona-Santiago" y "Morona Santiago" valen igual)
const PROVINCIAS_AMAZONIA = ['sucumbios', 'orellana', 'napo', 'pastaza', 'morona', 'zamora'];

export type ZonaEnvio = 'local' | 'amazonia' | 'resto';

export function zonaEnvio(provincia: string, ciudad: string): ZonaEnvio {
    if (CIUDADES_LOCALES.includes(normalizar(ciudad.trim()))) return 'local';

    const prov = normalizar(provincia.trim());
    if (PROVINCIAS_AMAZONIA.some(p => prov.startsWith(p))) return 'amazonia';

    return 'resto';
}

export function costoEnvio(provincia: string, ciudad: string): number {
    switch (zonaEnvio(provincia, ciudad)) {
        case 'local': return ENVIO_LOCAL;
        case 'amazonia': return ENVIO_AMAZONIA;
        default: return ENVIO_RESTO;
    }
}