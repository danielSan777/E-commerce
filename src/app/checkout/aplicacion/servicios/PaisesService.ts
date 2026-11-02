import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Un país del selector de código telefónico (viene de REST Countries)
export interface Pais {
    codigo: string;   // ISO de 2 letras: EC, CO, US...
    nombre: string;   // en español
    prefijo: string;  // +593
    bandera: string;  // URL de la bandera (vacío = se dibuja la de Ecuador con CSS)
}

// Valor inicial (y de respaldo si REST Countries no responde)
export const ECUADOR: Pais = { codigo: 'EC', nombre: 'Ecuador', prefijo: '+593', bandera: '' };

interface PaisApi {
    cca2: string;
    name: { common: string };
    translations?: { spa?: { common?: string } };
    idd?: { root?: string; suffixes?: string[] };
    flags?: { svg?: string; png?: string };
}

/*
 * REST Countries (restcountries.com, gratis y sin clave): nombre, código telefónico y bandera de cada país.
 * Aquí NO hay provincias ni ciudades: esas salen de UbicacionesService.
 */
@Injectable({ providedIn: 'root' })
export class PaisesService {

    // ===== EDITABLE =====
    private readonly URL = 'https://restcountries.com/v3.1/all?fields=name,cca2,idd,flags,translations';

    private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));
    private pendiente: Promise<Pais[]> | null = null;

    paises(): Promise<Pais[]> {
        if (!this.esNavegador) return Promise.resolve([ECUADOR]);

        if (!this.pendiente) {
            this.pendiente = this.cargar().catch(error => {
                this.pendiente = null;
                throw error;
            });
        }
        return this.pendiente;
    }

    private async cargar(): Promise<Pais[]> {
        const respuesta = await fetch(this.URL, { signal: AbortSignal.timeout(15000) });
        if (!respuesta.ok) throw new Error(`REST Countries respondió ${respuesta.status}`);

        const datos = (await respuesta.json()) as PaisApi[];

        const lista: Pais[] = [];
        for (const p of datos) {
            const raiz = p.idd?.root;
            if (!raiz) continue; // sin código telefónico (por ejemplo la Antártida)

            // Un solo sufijo: +593. Varios (Estados Unidos, Rusia...): se queda solo la raíz, +1, +7
            const sufijos = p.idd?.suffixes ?? [];
            const prefijo = sufijos.length === 1 ? raiz + sufijos[0] : raiz;

            lista.push({
                codigo: p.cca2,
                nombre: p.translations?.spa?.common ?? p.name.common,
                prefijo,
                bandera: p.flags?.svg ?? p.flags?.png ?? '',
            });
        }

        if (!lista.length) throw new Error('REST Countries no devolvió países');

        // Ecuador primero y el resto por orden alfabético
        return lista.sort((a, b) =>
            a.codigo === 'EC' ? -1 : b.codigo === 'EC' ? 1 : a.nombre.localeCompare(b.nombre, 'es')
        );
    }
}