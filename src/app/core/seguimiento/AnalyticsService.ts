import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type Parametros = Record<string, unknown>;

// Función `track()` del Paso 1/20: empuja el evento al `dataLayer`; el contenedor GTM (Paso 20, cuentas de Josué) lo reparte
// a GA4, Meta y TikTok. Hoy no hay GTM cargado, así que solo queda en el `dataLayer`. Los nombres son los del plan de eventos.
// Angular no calcula dinero: aquí solo viajan identificadores y nombres; el valor de las compras lo envía el servidor.
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
    private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

    track(evento: string, parametros: Parametros = {}): void {
        if (!this.esNavegador) return;
        const w = window as unknown as { dataLayer?: Parametros[] };
        (w.dataLayer ??= []).push({ event: evento, ...parametros });
    }
}
