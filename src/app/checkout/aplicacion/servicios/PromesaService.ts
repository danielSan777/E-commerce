import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { API_URL } from '../../../core/configuracion/api';
import { SIN_CARGANDO } from '../../../shared/interceptores/cargandoInterceptor';
import { Promesa, VentanaDisponible, VentanasDisponibles } from '../../dominio/interfaces/promesa';

const VIGENCIA_MS = 30_000;       // varias pantallas piden la promesa a la vez: se reutiliza durante 30 s
const LATIDO_MS = 30_000;         // cada cuánto se actualiza el contador en pantalla

/*
 * Promesa de entrega y ventanas (Pasos 8 y 9). Las calcula Laravel (ciclo, corte, feriados, domingos, Amazonía);
 * Angular solo las muestra. Se piden solo en el navegador: la promesa cambia con la hora y nunca debe quedar
 * dentro de un HTML guardado.
 *
 * El contador usa la hora del SERVIDOR (`server_now`) más el tiempo transcurrido medido con un reloj monótono,
 * así cambiar la hora del teléfono no lo altera. Al llegar el corte, o al volver a la pestaña, se vuelve a pedir.
 */
@Injectable({ providedIn: 'root' })
export class PromesaService {
    private http = inject(HttpClient);
    private api = inject(API_URL);
    private documento = inject(DOCUMENT);
    private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

    readonly promesa = signal<Promesa | null>(null);
    readonly ventanas = signal<VentanaDisponible[]>([]);
    readonly fallo = signal(false);

    private canton = '';
    private pedidoEn = 0;
    private anclaServidor = 0;   // server_now en ms
    private anclaReloj = 0;      // performance.now() cuando llegó la respuesta
    private latido = signal(0);
    private iniciado = false;

    /** «Pídelo en las próximas 3 h 42 min», contado con la hora del servidor; vacío si no hay promesa. */
    readonly contador = computed(() => {
        this.latido();
        const p = this.promesa();
        if (!p) return '';
        const restante = this.restanteMs(p);
        if (restante >= 24 * 3_600_000) return p.countdown_label; // «Pídelo antes del lunes a las 20:00»
        return restante <= 0 ? '' : etiquetaContador(restante);
    });

    /**
     * Pide la promesa y las ventanas. `canton` es el código del INEC del destino: la Amazonía suma un día.
     * Sin `forzar` se reutiliza lo pedido hace menos de 30 segundos para el mismo destino.
     */
    cargar(canton = '', forzar = false): void {
        if (!this.esNavegador) return;
        this.iniciar();
        if (!forzar && canton === this.canton && Date.now() - this.pedidoEn < VIGENCIA_MS && this.promesa()) return;
        if (canton !== this.canton) this.ventanas.set([]);   // otro destino: las ventanas anteriores ya no sirven
        this.canton = canton;
        this.pedidoEn = Date.now();
        this.fallo.set(false);
        const opciones = { params: canton ? new HttpParams().set('canton', canton) : new HttpParams(), context: new HttpContext().set(SIN_CARGANDO, true) };

        this.http.get<Promesa>(`${this.api}/delivery/promise`, opciones).subscribe({
            next: p => {
                if (canton !== this.canton) return;   // llegó tarde: ya se pidió otro destino
                this.anclaServidor = Date.parse(p.server_now);
                this.anclaReloj = performance.now();
                this.promesa.set(p);
                this.latido.update(n => n + 1);
            },
            error: () => { this.pedidoEn = 0; this.fallo.set(true); },
        });
        this.http.get<VentanasDisponibles>(`${this.api}/delivery/windows`, opciones).subscribe({
            next: r => { if (canton === this.canton) this.ventanas.set(r.windows); },
            error: () => { this.pedidoEn = 0; },
        });
    }

    /** ¿Esta ventana sigue ofrecida por Laravel? Una elegida en otra visita puede haber quedado en el pasado. */
    esVigente(inicio: string, fin: string): boolean {
        return this.ventanas().some(v => v.available && v.start === inicio && v.end === fin);
    }

    private restanteMs(p: Promesa): number {
        return Date.parse(p.cutoff_at) - (this.anclaServidor + (performance.now() - this.anclaReloj));
    }

    // Un solo temporizador y un solo aviso de «volví a la pestaña» para toda la app
    private iniciar(): void {
        if (this.iniciado) return;
        this.iniciado = true;
        setInterval(() => {
            const p = this.promesa();
            this.latido.update(n => n + 1);
            if (p && this.restanteMs(p) <= 0) this.cargar(this.canton, true);   // llegó el corte: nueva promesa
        }, LATIDO_MS);
        this.documento.addEventListener('visibilitychange', () => {
            if (this.documento.visibilityState === 'visible') this.cargar(this.canton, true);
        });
    }
}

/** 13_320_000 ms → «Pídelo en las próximas 3 h 42 min»; menos de una hora → «15 min». */
export function etiquetaContador(ms: number): string {
    const minutos = Math.max(0, Math.ceil(ms / 60_000));
    return `Pídelo en las próximas ${minutos >= 60 ? `${Math.floor(minutos / 60)} h ${minutos % 60} min` : `${minutos} min`}`;
}
