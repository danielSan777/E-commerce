import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { conErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { HojaDeProduccion, ListaDeEnvios, ResultadoDeLote } from '../../dominio/interfaces/hojas-admin';

// Hoja de producción y lista de envíos de un ciclo, y "Enviado" por lote. Laravel arma los datos; aquí solo se muestran.
@Injectable({ providedIn: 'root' })
export class HojasAdminService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  produccion(fecha: string): Observable<HojaDeProduccion> {
    return this.http.get<HojaDeProduccion>(`${this.api}/admin/cycles/${fecha}/production`).pipe(conErrorApi());
  }

  envios(fecha: string): Observable<ListaDeEnvios> {
    return this.http.get<ListaDeEnvios>(`${this.api}/admin/cycles/${fecha}/shipping`).pipe(conErrorApi());
  }

  enviarLote(pedidos: { number: string; tracking_number: string }[]): Observable<ResultadoDeLote> {
    return this.http.post<ResultadoDeLote>(`${this.api}/admin/orders/ship-batch`, { orders: pedidos }).pipe(conErrorApi());
  }
}
