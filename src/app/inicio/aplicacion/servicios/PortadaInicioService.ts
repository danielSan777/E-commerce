import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { SIN_CARGANDO } from '../../../shared/interceptores/cargandoInterceptor';
import { API_URL } from '../../../core/configuracion/api';
import { PortadaInicio } from '../../dominio/interfaces/portada';

// Imagen o video de la portada de la página principal, elegido por el administrador. Si no hay o la API falla, la tienda usa su imagen de siempre.
export interface EncabezadoCategorias { title: string | null; subtitle: string | null; items: PortadaInicio[] }

@Injectable({ providedIn: 'root' })
export class PortadaInicioService {
  private encabezado$?: Observable<EncabezadoCategorias>;
  private http = inject(HttpClient);
  private api = inject(API_URL);

  /** Las portadas en el orden en que se agregaron; lista vacía si no hay o la API falla. */
  portadas(): Observable<PortadaInicio[]> {
    return this.http.get<{ data: PortadaInicio | null; items?: PortadaInicio[] }>(`${this.api}/home/hero`).pipe(
      map(r => r.items ?? (r.data ? [r.data] : [])), catchError(() => of([])));
  }

  /** Encabezado de /categorias: textos elegidos en el panel (null = los de siempre) y sus imágenes o videos (vacío = las fotos de las categorías). */
  encabezadoCategorias(enSegundoPlano = false): Observable<EncabezadoCategorias> {
    this.encabezado$ ??= this.http.get<{ title: string | null; subtitle: string | null; items?: PortadaInicio[] }>(`${this.api}/categories-page`,
      { context: enSegundoPlano ? new HttpContext().set(SIN_CARGANDO, true) : undefined }).pipe(
      map(r => ({ title: r.title ?? null, subtitle: r.subtitle ?? null, items: r.items ?? [] })),
      catchError(() => { this.encabezado$ = undefined; return of({ title: null, subtitle: null, items: [] }); }),
      shareReplay(1));
    return this.encabezado$;
  }
}
