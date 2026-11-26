import { DOCUMENT } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SEGUIMIENTO } from '../configuracion/tienda';

export type EleccionDeCookies = 'aceptado' | 'rechazado';

const CLAVE = 'jds_cookies';

// Aviso de cookies simple (Paso 20): el visitante acepta o rechaza el seguimiento de marketing y analítica.
// Hasta que acepte no se carga Google Tag Manager (y con él GA4, Meta y TikTok); si rechaza, no se carga nunca.
// La elección se guarda en el navegador y se puede cambiar desde el pie de página.
@Injectable({ providedIn: 'root' })
export class ConsentimientoService {
    private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));
    private doc = inject(DOCUMENT);
    private cargado = false;

    /** Lo que eligió el visitante; null = todavía no eligió. */
    readonly eleccion = signal<EleccionDeCookies | null>(null);
    /** El aviso se muestra mientras no haya elegido, o cuando pidió cambiar su elección. */
    readonly mostrarAviso = signal(false);
    readonly marketing = computed(() => this.eleccion() === 'aceptado');

    /** Se llama una vez en el navegador: lee la elección guardada y, si ya aceptó, carga GTM. */
    iniciar(): void {
        if (!this.esNavegador) return;
        const guardada = this.leer();
        this.eleccion.set(guardada);
        this.mostrarAviso.set(guardada === null);
        if (guardada === 'aceptado') this.cargarGtm();
    }

    aceptar(): void {
        this.elegir('aceptado');
        this.cargarGtm();
    }

    rechazar(): void {
        this.elegir('rechazado');
    }

    /** Desde el pie de página: vuelve a mostrar el aviso para cambiar la elección. */
    reabrir(): void {
        this.mostrarAviso.set(true);
    }

    private elegir(valor: EleccionDeCookies): void {
        this.eleccion.set(valor);
        this.mostrarAviso.set(false);
        try { localStorage.setItem(CLAVE, valor); } catch { /* sin almacenamiento: vale solo para esta visita */ }
    }

    private leer(): EleccionDeCookies | null {
        try {
            const v = localStorage.getItem(CLAVE);
            return v === 'aceptado' || v === 'rechazado' ? v : null;
        } catch { return null; }
    }

    /** Carga GTM una sola vez. Los eventos que ya estaban en el `dataLayer` los recibe al arrancar. */
    private cargarGtm(): void {
        const id = SEGUIMIENTO.gtmId;
        if (this.cargado || !id || !/^GTM-[A-Z0-9]+$/.test(id)) return;
        this.cargado = true;
        const w = window as unknown as { dataLayer?: unknown[] };
        (w.dataLayer ??= []).push({ 'gtm.start': Date.now(), event: 'gtm.js' });
        const script = this.doc.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
        this.doc.head.appendChild(script);
    }
}
