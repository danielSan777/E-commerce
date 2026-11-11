import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { ConfiguracionGuardada, ConfiguradorApi, adaptarConfigurador } from '../../dominio/configurador';

/** Configuración del personalizador de un producto, desde Laravel (la propia del producto o la de su categoría). */
@Injectable({ providedIn: 'root' })
export class ConfiguradorService {
    private http = inject(HttpClient);
    private api = inject(API_URL);

    configuracion(slugDelProducto: string): Observable<ConfiguracionGuardada> {
        return this.http.get<ConfiguradorApi>(`${this.api}/products/${encodeURIComponent(slugDelProducto)}/configurator`).pipe(map(adaptarConfigurador));
    }
}
