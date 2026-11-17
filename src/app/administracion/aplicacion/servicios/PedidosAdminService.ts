import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { conErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { FiltroPedidos, PedidoAdmin } from '../../dominio/interfaces/pedidos-admin';

// Pedidos del panel: ver, revisar el comprobante, marcar pagado o cancelar. Laravel decide cupos, ciclos y ventanas.
@Injectable({ providedIn: 'root' })
export class PedidosAdminService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  listar(filtro: FiltroPedidos): Observable<PedidoAdmin[]> {
    return this.http.get<{ data: PedidoAdmin[] }>(`${this.api}/admin/orders`, { params: new HttpParams().set('status', filtro) })
      .pipe(map(r => r.data), conErrorApi());
  }

  /** `fueraDePlazo`: pagó tarde, se le asigna el siguiente ciclo. `confirmarSobrecupo`: acepta pasar el límite del ciclo. */
  marcarPagado(numero: string, opciones: { fueraDePlazo?: boolean; confirmarSobrecupo?: boolean } = {}): Observable<PedidoAdmin> {
    return this.http.post<PedidoAdmin>(`${this.api}/admin/orders/${numero}/mark-paid`, {
      late: !!opciones.fueraDePlazo, confirm_over_capacity: !!opciones.confirmarSobrecupo,
    }).pipe(conErrorApi());
  }

  cancelar(numero: string): Observable<PedidoAdmin> {
    return this.http.post<PedidoAdmin>(`${this.api}/admin/orders/${numero}/cancel`, {}).pipe(conErrorApi());
  }

  /** El comprobante está en un disco privado y exige sesión: se descarga con el token y se abre como archivo local. */
  comprobante(numero: string): Observable<Blob> {
    return this.http.get(`${this.api}/admin/orders/${numero}/receipt`, { responseType: 'blob' }).pipe(conErrorApi());
  }
}
