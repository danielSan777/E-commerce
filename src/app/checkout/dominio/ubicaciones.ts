import { normalizar } from './validaciones/validaciones';
import inec from './datos/ubicaciones-inec.json';
import sectores from './datos/localidades.json';

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

// Localidad opcional dentro de un cantón, con zona de envío propia (por ejemplo La Aurora, en Daule)
export interface Localidad { canton: string; nombre: string; zona: 'local' | 'amazonia' | 'resto' }

export const LOCALIDADES: readonly Localidad[] = sectores.localidades as Localidad[];

export function buscarProvincia(nombre: string): Provincia | undefined {
    const n = normalizar(nombre.trim());
    return PROVINCIAS.find(p => normalizar(p.nombre) === n);
}

export function buscarCanton(provincia: string, canton: string): Canton | undefined {
    const n = normalizar(canton.trim());
    return buscarProvincia(provincia)?.cantones.find(c => normalizar(c.nombre) === n);
}

export function localidadesDe(provincia: string, canton: string): Localidad[] {
    const codigo = buscarCanton(provincia, canton)?.codigo;
    return codigo ? LOCALIDADES.filter(l => l.canton === codigo) : [];
}

export function buscarLocalidad(provincia: string, canton: string, localidad: string): Localidad | undefined {
    const n = normalizar(localidad.trim());
    return localidadesDe(provincia, canton).find(l => normalizar(l.nombre) === n);
}

export function nombresDeProvincias(): string[] {
    return PROVINCIAS.map(p => p.nombre);
}

export function nombresDeCantones(provincia: string): string[] {
    return buscarProvincia(provincia)?.cantones.map(c => c.nombre) ?? [];
}
