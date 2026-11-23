import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { conErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { AjusteModoVenta, CantonAdmin, CodigoZona, DatosZona, ModoVenta, ZonaAdmin } from '../../dominio/interfaces/envios-admin';

// Envíos del panel: zonas con su tarifa y la zona de cada cantón. Todo se guarda en la base de datos desde Laravel.
@Injectable({ providedIn: 'root' })
export class EnviosAdminService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  modoDeVenta(): Observable<AjusteModoVenta> {
    return this.http.get<AjusteModoVenta>(`${this.api}/admin/sales-mode`).pipe(conErrorApi());
  }

  guardarModoDeVenta(modo: ModoVenta, descuento: number): Observable<AjusteModoVenta> {
    return this.http.put<AjusteModoVenta>(`${this.api}/admin/sales-mode`, { mode: modo, discount_percent: descuento }).pipe(conErrorApi());
  }

  zonas(): Observable<ZonaAdmin[]> {
    return this.http.get<{ data: ZonaAdmin[] }>(`${this.api}/admin/shipping/zones`).pipe(map(r => r.data), conErrorApi());
  }

  actualizarZona(codigo: CodigoZona, datos: DatosZona): Observable<Omit<ZonaAdmin, 'cantons_count'>> {
    return this.http.put<Omit<ZonaAdmin, 'cantons_count'>>(`${this.api}/admin/shipping/zones/${codigo}`, datos).pipe(conErrorApi());
  }

  /** Todos los cantones (unos 230): el filtro por provincia, zona y texto se hace en pantalla, al instante. */
  cantones(): Observable<CantonAdmin[]> {
    return this.http.get<{ data: CantonAdmin[] }>(`${this.api}/admin/shipping/cantons`).pipe(map(r => r.data), conErrorApi());
  }

  asignarZona(zona: CodigoZona, cantones: string[]): Observable<number> {
    return this.http.put<{ updated: number }>(`${this.api}/admin/shipping/cantons/zone`, { zone: zona, cantons: cantones }).pipe(map(r => r.updated), conErrorApi());
  }
}
