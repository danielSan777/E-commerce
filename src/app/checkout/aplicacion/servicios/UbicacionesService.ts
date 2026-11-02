import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/*
 * Provincias y ciudades de Ecuador desde una API REST gratuita y sin clave.
 *
 * IMPORTANTE: REST Countries (restcountries.com) NO tiene provincias ni ciudades: solo datos del país
 * (nombre, capital, código telefónico, bandera...). Por eso las provincias y ciudades salen de
 * CountriesNow (countriesnow.space), que sí las tiene y también es gratis y sin clave.
 * REST Countries se usa en PaisesService para el código telefónico y la bandera.
 *
 * Si algún día cambias de API, solo hay que tocar este archivo: la pantalla usa únicamente
 * provincias() y ciudades(provincia).
 */

interface RespuestaApi<T> { error?: boolean; msg?: string; data?: T }
interface EstadoApi { name: string }

@Injectable({ providedIn: 'root' })
export class UbicacionesService {

    // ===== EDITABLES =====
    private readonly API = 'https://countriesnow.space/api/v0.1';
    private readonly PAIS = 'Ecuador';
    private readonly TIEMPO_MAXIMO_MS = 15000;

    private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

    private pendienteProvincias: Promise<string[]> | null = null;
    private pendientesCiudades = new Map<string, Promise<string[]>>();
    private nombresApi = new Map<string, string>(); // "Guayas" -> el nombre tal como lo escribe la API

    // La lista queda guardada: se pide una sola vez por visita. Si falla, la próxima llamada vuelve a intentar.
    provincias(): Promise<string[]> {
        if (!this.esNavegador) return Promise.resolve([]);

        if (!this.pendienteProvincias) {
            this.pendienteProvincias = this.cargarProvincias().catch(error => {
                this.pendienteProvincias = null;
                throw error;
            });
        }
        return this.pendienteProvincias;
    }

    ciudades(provincia: string): Promise<string[]> {
        if (!this.esNavegador) return Promise.resolve([]);

        let pendiente = this.pendientesCiudades.get(provincia);
        if (!pendiente) {
            pendiente = this.cargarCiudades(provincia).catch(error => {
                this.pendientesCiudades.delete(provincia);
                throw error;
            });
            this.pendientesCiudades.set(provincia, pendiente);
        }
        return pendiente;
    }

    private async cargarProvincias(): Promise<string[]> {
        const respuesta = await this.post<{ states?: EstadoApi[] }>('countries/states', { country: this.PAIS });
        const estados = respuesta.states ?? [];
        if (!estados.length) throw new Error('La API no devolvió provincias');

        const nombres = estados.map(e => {
            const limpio = this.limpiar(e.name);
            this.nombresApi.set(limpio, e.name);
            return limpio;
        });

        return this.ordenar([...new Set(nombres)]);
    }

    private async cargarCiudades(provincia: string): Promise<string[]> {
        // Se prueba el nombre sin "Province" y, si no responde, tal como lo escribió la API
        const intentos = [...new Set([provincia, this.nombresApi.get(provincia) ?? provincia])];
        let huboRespuesta = false;
        let ultimoError: unknown = null;

        for (const estado of intentos) {
            try {
                const lista = await this.post<string[]>('countries/state/cities', { country: this.PAIS, state: estado });
                huboRespuesta = true;
                const ciudades = (Array.isArray(lista) ? lista : []).map(c => String(c).trim()).filter(Boolean);
                if (ciudades.length) return this.ordenar([...new Set(ciudades)]);
            } catch (error) {
                ultimoError = error;
            }
        }

        if (huboRespuesta) return []; // la API respondió, pero esa provincia no tiene ciudades
        throw ultimoError ?? new Error(`La API no devolvió ciudades para ${provincia}`);
    }

    private async post<T>(ruta: string, cuerpo: object): Promise<T> {
        const respuesta = await fetch(`${this.API}/${ruta}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cuerpo),
            signal: AbortSignal.timeout(this.TIEMPO_MAXIMO_MS),
        });

        const json = (await respuesta.json().catch(() => null)) as RespuestaApi<T> | null;
        if (!respuesta.ok || !json || json.error) {
            throw new Error(json?.msg ?? `Error ${respuesta.status} al consultar ${ruta}`);
        }
        return json.data as T;
    }

    // "Guayas Province" -> "Guayas"
    private limpiar(nombre: string): string {
        return nombre.replace(/\s+(province|provincia)$/i, '').trim();
    }

    private ordenar(lista: string[]): string[] {
        return lista.sort((a, b) => a.localeCompare(b, 'es'));
    }
}