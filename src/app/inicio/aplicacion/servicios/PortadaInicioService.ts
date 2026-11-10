import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { PortadaInicio } from '../../dominio/interfaces/portada';

// Imagen o video de la portada de la página principal, elegido por el administrador. Si no hay o la API falla, la tienda usa su imagen de siempre.
@Injectable({ providedIn: 'root' })
export class PortadaInicioService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  /** Las portadas en el orden en que se agregaron; lista vacía si no hay o la API falla. */
  portadas(): Observable<PortadaInicio[]> {
    return this.http.get<{ data: PortadaInicio | null; items?: PortadaInicio[] }>(`${this.api}/home/hero`).pipe(
      map(r => r.items ?? (r.data ? [r.data] : [])), catchError(() => of([])));
  }
}
