import { normalizar } from './validaciones/validaciones';
import inec from './datos/ubicaciones-inec.json';
import zonaA from './datos/sectores-zona-a.json';

/*
 * Provincias y cantones de Ecuador: Clasificador Geográfico Estadístico 2026 del INEC
 * (actualizado al 31 de diciembre de 2025), guardado dentro del proyecto en datos/ubicaciones-inec.json.
 * No se usa ningún servicio externo. Ese mismo archivo alimentará después el seeder de Laravel.
 *
 * Las "zonas en estudio" (código 90) no son provincias ni cantones y no se incluyen.
 */

export interface Canton { codigo: string; nombre: string }
export interface Provincia { codigo: string; nombre: string; cantones: Canton[] }

export const PROVINCIAS: readonly Provincia[] = inec.provincias;

// Sectores que se muestran como un cantón más en la lista ("La Aurora - Daule") y se cobran como Zona A.
export interface Sector { provincia: string; canton: string; nombre: string }

export const SECTORES_ZONA_A: readonly Sector[] = zonaA.sectores;

export function buscarSector(provincia: string, nombre: string): Sector | undefined {
    const prov = buscarProvincia(provincia);
    const n = normalizar(nombre.trim());
    return prov ? SECTORES_ZONA_A.find(s => s.provincia === prov.codigo && normalizar(s.nombre) === n) : undefined;
}

export function buscarProvincia(nombre: string): Provincia | undefined {
    const n = normalizar(nombre.trim());
    return PROVINCIAS.find(p => normalizar(p.nombre) === n);
}

export function buscarCanton(provincia: string, canton: string): Canton | undefined {
    const n = normalizar(canton.trim());
    return buscarProvincia(provincia)?.cantones.find(c => normalizar(c.nombre) === n);
}

export function nombresDeProvincias(): string[] {
    return PROVINCIAS.map(p => p.nombre);
}

export function nombresDeCantones(provincia: string): string[] {
    const prov = buscarProvincia(provincia);
    if (!prov) return [];
    const sectores = SECTORES_ZONA_A.filter(s => s.provincia === prov.codigo).map(s => s.nombre);
    return [...prov.cantones.map(c => c.nombre), ...sectores];
}
