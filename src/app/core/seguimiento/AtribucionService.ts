import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface Toque {
    utm: { source: string | null; medium: string | null; campaign: string | null; content: string | null; term: string | null };
    fbclid: string | null;
    ttclid: string | null;
    landing_url: string;
    date: string;                     // ISO UTC
}

const CLAVE = 'jds_atribucion';

// Captura de atribución al aterrizar (Paso 1): UTMs, fbclid y ttclid, con la página de entrada y la fecha.
// Primer toque: el de la primera visita (no se sobrescribe). Último toque: el de la visita más reciente que traiga campaña.
// Se guarda en el navegador y viaja con el checkout (contrato "Tracking y atribución"); Laravel lo valida y lo guarda en el pedido.
@Injectable({ providedIn: 'root' })
export class AtribucionService {
    private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

    capturar(): void {
        if (!this.esNavegador) return;
        const actual = this.leer();
        const toque = this.armarToque(window.location.href, window.location.search);
        const traeCampana = !!(toque.utm.source || toque.utm.medium || toque.utm.campaign || toque.fbclid || toque.ttclid);

        const nuevo = {
            first_touch: actual.first_touch ?? toque,
            last_touch: traeCampana || !actual.last_touch ? toque : actual.last_touch,
        };
        this.guardar(nuevo);
    }

    first(): Toque | null { return this.leer().first_touch ?? null; }
    last(): Toque | null { return this.leer().last_touch ?? null; }

    armarToque(url: string, search: string): Toque {
        const q = new URLSearchParams(search);
        const v = (k: string) => q.get(k)?.trim() || null;
        return {
            utm: { source: v('utm_source'), medium: v('utm_medium'), campaign: v('utm_campaign'), content: v('utm_content'), term: v('utm_term') },
            fbclid: v('fbclid'),
            ttclid: v('ttclid'),
            landing_url: url,
            date: new Date().toISOString(),
        };
    }

    private leer(): { first_touch?: Toque; last_touch?: Toque } {
        try { return JSON.parse(localStorage.getItem(CLAVE) ?? '{}'); } catch { return {}; }
    }

    private guardar(valor: object): void {
        try { localStorage.setItem(CLAVE, JSON.stringify(valor)); } catch { /* sin almacenamiento: se sigue sin atribución */ }
    }
}
