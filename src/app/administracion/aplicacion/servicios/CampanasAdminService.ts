import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { conErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { CampanaAdmin, DatosCampana } from '../../dominio/interfaces/campana-admin';

// Campañas del panel: todo viene de Laravel. Los errores llegan ya normalizados (ErrorApi) con el mensaje en español.
@Injectable({ providedIn: 'root' })
export class CampanasAdminService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  listar(): Observable<CampanaAdmin[]> {
    return this.http.get<{ data: CampanaAdmin[] }>(this.url()).pipe(map(r => r.data), conErrorApi());
  }

  crear(datos: DatosCampana): Observable<CampanaAdmin> {
    return this.http.post<CampanaAdmin>(this.url(), datos).pipe(conErrorApi());
  }

  /** La dirección (slug) no se envía: no se puede cambiar. */
  editar(slug: string, datos: DatosCampana): Observable<CampanaAdmin> {
    return this.http.put<CampanaAdmin>(this.url(slug), datos).pipe(conErrorApi());
  }

  eliminar(slug: string): Observable<void> {
    return this.http.delete<void>(this.url(slug)).pipe(conErrorApi());
  }

  private url(slug?: string): string {
    return `${this.api}/admin/campaigns${slug ? '/' + encodeURIComponent(slug) : ''}`;
  }
}
