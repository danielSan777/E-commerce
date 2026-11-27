import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type Parametros = Record<string, unknown>;

// Función `track()` del Paso 1/20: empuja el evento al `dataLayer`; el contenedor GTM (Paso 20, cuentas de Josué) lo reparte
// a GA4, Meta y TikTok. Hoy no hay GTM cargado, así que solo queda en el `dataLayer`. Los nombres son los del plan de eventos.
// Angular no calcula dinero: el valor de los eventos lo entrega Laravel (cotización y datos del pedido); ver ParametrosComercio.ts.
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
    private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

    track(evento: string, parametros: Parametros = {}): void {
        if (!this.esNavegador) return;
        const w = window as unknown as { dataLayer?: Parametros[] };
        (w.dataLayer ??= []).push({ event: evento, ...parametros });
    }

    /** Como `track`, pero una sola vez por `clave` en esta pestaña (recargar la pantalla de respuesta no cuenta la compra otra vez). */
    trackUnaVez(clave: string, evento: string, parametros: Parametros = {}): void {
        if (!this.esNavegador) return;
        try {
            if (sessionStorage.getItem(clave)) return;
            sessionStorage.setItem(clave, '1');
        } catch { /* sin almacenamiento: Meta y GA4 igual descartan el duplicado por event_id / transaction_id */ }
        this.track(evento, parametros);
    }
}
