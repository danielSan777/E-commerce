import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { conErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { ListaCiclos } from '../../dominio/interfaces/ciclos-admin';

// Ciclos del panel: pedidos y capacidad de cada ciclo, capacidad de un ciclo puntual y "Pasar las ventas al siguiente ciclo".
// Laravel cuenta y decide; cada acción devuelve la lista ya actualizada.
@Injectable({ providedIn: 'root' })
export class CiclosAdminService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  listar(): Observable<ListaCiclos> {
    return this.http.get<ListaCiclos>(`${this.api}/admin/cycles`).pipe(conErrorApi());
  }

  cerrar(fecha: string): Observable<ListaCiclos> {
    return this.http.post<ListaCiclos>(`${this.api}/admin/cycles/${fecha}/close`, {}).pipe(conErrorApi());
  }

  reabrir(fecha: string): Observable<ListaCiclos> {
    return this.http.post<ListaCiclos>(`${this.api}/admin/cycles/${fecha}/reopen`, {}).pipe(conErrorApi());
  }

  /** `null` devuelve la capacidad nominal. */
  cambiarCapacidad(fecha: string, capacidad: number | null): Observable<ListaCiclos> {
    return this.http.put<ListaCiclos>(`${this.api}/admin/cycles/${fecha}/capacity`, { capacity: capacidad }).pipe(conErrorApi());
  }
}
