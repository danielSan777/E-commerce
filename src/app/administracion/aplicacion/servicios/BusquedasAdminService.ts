import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { conErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { ListaBusquedasSinResultados } from '../../dominio/interfaces/busquedas-admin';

// Lo que la gente buscó en la tienda y no encontró (últimos 30 días): ideas de productos o de palabras de búsqueda que faltan.
@Injectable({ providedIn: 'root' })
export class BusquedasAdminService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  sinResultados(dias = 30): Observable<ListaBusquedasSinResultados> {
    return this.http.get<ListaBusquedasSinResultados>(`${this.api}/admin/searches/no-results`, { params: { days: dias } }).pipe(conErrorApi());
  }
}
