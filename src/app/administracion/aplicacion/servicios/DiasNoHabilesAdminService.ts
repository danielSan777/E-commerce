import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { conErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { DatosDiaNoHabil, DiaNoHabil, ListaDiasNoHabiles } from '../../dominio/interfaces/dias-no-habiles';

// Feriados y cierres del panel. Laravel los guarda y los usa para calcular despachos y ventanas; aquí solo se cargan y se ven.
@Injectable({ providedIn: 'root' })
export class DiasNoHabilesAdminService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  listar(): Observable<ListaDiasNoHabiles> {
    return this.http.get<ListaDiasNoHabiles>(`${this.api}/admin/non-working-days`).pipe(conErrorApi());
  }

  /** Un día, o un rango si trae `end_date`. Devuelve los días guardados. */
  guardar(datos: DatosDiaNoHabil): Observable<DiaNoHabil[]> {
    return this.http.post<DiaNoHabil | { data: DiaNoHabil[] }>(`${this.api}/admin/non-working-days`, datos).pipe(
      map(r => 'data' in r ? r.data : [r]), conErrorApi());
  }

  eliminar(fecha: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/admin/non-working-days/${fecha}`).pipe(conErrorApi());
  }
}
