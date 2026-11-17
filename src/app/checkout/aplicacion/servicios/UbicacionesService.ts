import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { API_URL } from '../../../core/configuracion/api';
import { SIN_CARGANDO } from '../../../shared/interceptores/cargandoInterceptor';
import {
    CATALOGO_VACIO, CatalogoUbicaciones, CodigoZona, buscarCanton, buscarProvincia, nombresDeCantones, nombresDeProvincias,
} from '../../dominio/ubicaciones';
import { costoEnvio, envioDesde, envioDisponible, tieneDiaAdicional, zonaEnvio } from '../../dominio/validaciones/envio';
import { normalizar } from '../../dominio/validaciones/validaciones';

// Respuesta de Laravel (GET /api/v1/locations)
interface UbicacionesApi {
    zones: { code: CodigoZona; name: string; price_cents: number; extra_days: number; is_available: boolean }[];
    provinces: { code: string; name: string; cantons: { code: string; name: string; zone: CodigoZona; is_locality: boolean }[] }[];
}

/*
 * Provincias, cantones y zonas de envío. Se piden una sola vez a Laravel al abrir la pantalla y quedan en memoria
 * (listas y nombres ya armados), así escribir la provincia o el cantón filtra al instante sin volver a la API.
 */
@Injectable({ providedIn: 'root' })
export class UbicacionesService {
    private http = inject(HttpClient);
    private api = inject(API_URL);

    private datos = signal<CatalogoUbicaciones>(CATALOGO_VACIO);
    private pedido = false;

    readonly listo = signal(false);
    readonly fallo = signal(false);

    readonly catalogo = this.datos.asReadonly();
    readonly provincias = computed(() => nombresDeProvincias(this.datos()));
    // Nombres de cantones ya armados por provincia: no se recalculan en cada tecla
    private cantonesPorProvincia = computed(() => new Map(this.datos().provincias.map(p => [normalizar(p.nombre), nombresDeCantones(this.datos(), p.nombre)])));
    /** "Envío desde $3,50": null mientras no lleguen las zonas. */
    readonly tarifaDesde = computed(() => envioDesde(this.datos()));

    /** Pide las ubicaciones si todavía no se pidieron. Sin spinner global: la pantalla ya se está viendo. */
    cargar(): void {
        if (this.pedido) return;
        this.pedido = true;
        this.fallo.set(false);
        this.http.get<UbicacionesApi>(`${this.api}/locations`, { context: new HttpContext().set(SIN_CARGANDO, true) }).subscribe({
            next: r => {
                this.datos.set({
                    zonas: r.zones.map(z => ({ codigo: z.code, nombre: z.name, centavos: z.price_cents, diasAdicionales: z.extra_days, disponible: z.is_available })),
                    provincias: r.provinces.map(p => ({
                        codigo: p.code, nombre: p.name,
                        cantones: p.cantons.map(c => ({ codigo: c.code, nombre: c.name, zona: c.zone, sector: c.is_locality })),
                    })),
                });
                this.listo.set(true);
            },
            error: () => { this.pedido = false; this.fallo.set(true); },
        });
    }

    /** Vuelve a pedir las ubicaciones y tarifas (por ejemplo, cuando Laravel avisa que el total cambió). */
    recargar(): void {
        this.pedido = false;
        this.cargar();
    }

    cantones(provincia: string): string[] {
        return this.cantonesPorProvincia().get(normalizar(provincia.trim())) ?? [];
    }

    esProvinciaSinEnvio(provincia: string): boolean {
        const p = this.datos().provincias.find(x => normalizar(x.nombre) === normalizar(provincia.trim()));
        return !!p && p.cantones.length > 0 && p.cantones.every(c => !this.disponible(provincia, c.nombre));
    }

    /** Código del INEC de la provincia elegida ('' si todavía no hay datos o no existe). */
    codigoProvincia(provincia: string): string {
        return buscarProvincia(this.datos(), provincia)?.codigo ?? '';
    }

    /** Código del INEC del cantón elegido ('' si todavía no hay datos o no existe). */
    codigoCanton(provincia: string, canton: string): string {
        return buscarCanton(this.datos(), provincia, canton)?.codigo ?? '';
    }

    zona(provincia: string, canton: string): CodigoZona { return zonaEnvio(this.datos(), provincia, canton); }
    disponible(provincia: string, canton: string): boolean { return envioDisponible(this.datos(), provincia, canton); }
    diaAdicional(provincia: string, canton: string): boolean { return tieneDiaAdicional(this.datos(), provincia, canton); }
    costo(provincia: string, canton: string): number { return costoEnvio(this.datos(), provincia, canton); }
}
