import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of, shareReplay, tap } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { ConfiguracionGuardada, ConfiguradorApi, adaptarConfigurador } from '../../dominio/configurador';

/** Cuánto se reutiliza una configuración ya descargada. Pasado ese tiempo se vuelve a pedir a Laravel (así los cambios del panel llegan). */
const VIGENCIA_MS = 5 * 60 * 1000;

/** Configuración del personalizador de un producto, desde Laravel (la propia del producto o la de su categoría). */
@Injectable({ providedIn: 'root' })
export class ConfiguradorService {
    private http = inject(HttpClient);
    private api = inject(API_URL);

    private listas = new Map<string, { en: number; valor: ConfiguracionGuardada }>();
    private enCurso = new Map<string, Observable<ConfiguracionGuardada>>();

    /**
     * Si la configuración ya se descargó hace poco, se entrega al instante, sin consumir la API (p. ej. al editar una maceta del carrito).
     * Dos pantallas que la piden a la vez comparten una sola petición. Los errores no se guardan.
     */
    configuracion(slugDelProducto: string): Observable<ConfiguracionGuardada> {
        const lista = this.listas.get(slugDelProducto);
        if (lista && Date.now() - lista.en < VIGENCIA_MS) return of(lista.valor);

        const pendiente = this.enCurso.get(slugDelProducto);
        if (pendiente) return pendiente;

        const peticion = this.http.get<ConfiguradorApi>(`${this.api}/products/${encodeURIComponent(slugDelProducto)}/configurator`).pipe(
            map(adaptarConfigurador),
            tap({
                next: valor => { this.listas.set(slugDelProducto, { en: Date.now(), valor }); this.enCurso.delete(slugDelProducto); },
                error: () => this.enCurso.delete(slugDelProducto),
            }),
            shareReplay(1),
        );
        this.enCurso.set(slugDelProducto, peticion);
        return peticion;
    }

    /** Descarga la configuración en segundo plano para que la pantalla de personalizar abra al instante. No muestra errores. */
    adelantar(slugDelProducto: string): void {
        this.configuracion(slugDelProducto).subscribe({ next: c => this.precargarFoto(c.imagenBase), error: () => undefined });
    }

    private precargarFoto(url: string | undefined): void {
        if (url && typeof Image !== 'undefined') new Image().src = url;
    }
}
