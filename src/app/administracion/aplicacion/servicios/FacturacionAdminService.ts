import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { conErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { ListaPorFacturar, PedidoPorFacturar, ResultadoDeFacturado } from '../../dominio/interfaces/facturacion-admin';

// Facturación manual: Laravel dice qué pedidos faltan por facturar y a quién; Josué emite la factura SRI fuera del sistema y aquí la marca.
@Injectable({ providedIn: 'root' })
export class FacturacionAdminService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  /** `pending` = por facturar, `done` = ya facturados. */
  listar(estado: 'pending' | 'done'): Observable<ListaPorFacturar> {
    return this.http.get<ListaPorFacturar>(`${this.api}/admin/invoicing`, { params: { state: estado } }).pipe(conErrorApi());
  }

  marcar(pedidos: { number: string; invoice_number: string | null }[]): Observable<ResultadoDeFacturado> {
    return this.http.post<ResultadoDeFacturado>(`${this.api}/admin/invoicing/batch`, { orders: pedidos }).pipe(conErrorApi());
  }

  quitar(numero: string): Observable<PedidoPorFacturar> {
    return this.http.delete<PedidoPorFacturar>(`${this.api}/admin/invoicing/${numero}`).pipe(conErrorApi());
  }
}
