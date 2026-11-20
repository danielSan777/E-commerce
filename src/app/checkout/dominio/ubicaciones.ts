import { normalizar } from './validaciones/validaciones';

/*
 * Provincias, cantones y zonas de envío: vienen de la base de datos (GET /api/v1/locations) y el administrador
 * los edita desde el panel (Envíos). Aquí solo están los tipos y las búsquedas sobre lo ya descargado.
 * Los cantones son los del INEC y solo de Ecuador: todas las ventas son dentro del país.
 */

export type CodigoZona = 'A' | 'B' | 'C' | 'no_disponible';

export interface ZonaDeEnvio { codigo: CodigoZona; nombre: string; centavos: number; diasAdicionales: number; disponible: boolean }

/** Un cantón de la lista, o un sector ("La Aurora - Daule") que se muestra como un cantón más. */
export interface Canton { codigo: string; nombre: string; zona: CodigoZona; sector: boolean }
export interface Provincia { codigo: string; nombre: string; cantones: Canton[] }

export interface CatalogoUbicaciones { zonas: ZonaDeEnvio[]; provincias: Provincia[] }

export const CATALOGO_VACIO: CatalogoUbicaciones = { zonas: [], provincias: [] };

export function buscarProvincia(catalogo: CatalogoUbicaciones, nombre: string): Provincia | undefined {
    const n = normalizar(nombre.trim());
    return catalogo.provincias.find(p => normalizar(p.nombre) === n);
}

export function buscarCanton(catalogo: CatalogoUbicaciones, provincia: string, canton: string): Canton | undefined {
    const n = normalizar(canton.trim());
    return buscarProvincia(catalogo, provincia)?.cantones.find(c => normalizar(c.nombre) === n);
}

export function nombresDeProvincias(catalogo: CatalogoUbicaciones): string[] {
    return catalogo.provincias.map(p => p.nombre);
}

export function nombresDeCantones(catalogo: CatalogoUbicaciones, provincia: string): string[] {
    return buscarProvincia(catalogo, provincia)?.cantones.map(c => c.nombre) ?? [];
}
