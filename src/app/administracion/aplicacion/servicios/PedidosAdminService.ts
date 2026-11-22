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

  /** `buscar`: código del pedido (JDS-1005 o solo 1005); Laravel lo busca dentro del filtro elegido. */
  listar(filtro: FiltroPedidos, buscar = ''): Observable<PedidoAdmin[]> {
    let params = new HttpParams().set('status', filtro);
    if (buscar.trim()) params = params.set('q', buscar.trim());
    return this.http.get<{ data: PedidoAdmin[] }>(`${this.api}/admin/orders`, { params })
      .pipe(map(r => r.data), conErrorApi());
  }

  /** `fueraDePlazo`: pagó tarde, se le asigna el siguiente ciclo. `confirmarSobrecupo`: acepta pasar el límite del ciclo. */
  marcarPagado(numero: string, opciones: { fueraDePlazo?: boolean; confirmarSobrecupo?: boolean } = {}): Observable<PedidoAdmin> {
    return this.http.post<PedidoAdmin>(`${this.api}/admin/orders/${numero}/mark-paid`, {
      late: !!opciones.fueraDePlazo, confirm_over_capacity: !!opciones.confirmarSobrecupo,
    }).pipe(conErrorApi());
  }

  /** Foto de la maceta personalizada (`preview`) o foto del marco que subió el comprador (`frame-photo`). Exige sesión. */
  imagenDelItem(numero: string, item: number, cual: 'preview' | 'frame-photo'): Observable<Blob> {
    return this.http.get(`${this.api}/admin/orders/${numero}/items/${item}/${cual}`, { responseType: 'blob' }).pipe(conErrorApi());
  }

  /** Pedido pagado que entra a producción. */
  enProduccion(numero: string): Observable<PedidoAdmin> {
    return this.http.post<PedidoAdmin>(`${this.api}/admin/orders/${numero}/production`, {}).pipe(conErrorApi());
  }

  /** Pedido enviado, con la guía de Servientrega que verá el comprador. Volver a llamarlo corrige la guía. */
  enviado(numero: string, guia: string): Observable<PedidoAdmin> {
    return this.http.post<PedidoAdmin>(`${this.api}/admin/orders/${numero}/ship`, { tracking_number: guia }).pipe(conErrorApi());
  }

  /** Con `notificar` Laravel avisa al comprador por correo, con el motivo breve que se escriba. */
  cancelar(numero: string, aviso?: { notificar: boolean; motivo: string }): Observable<PedidoAdmin> {
    const cuerpo = aviso?.notificar ? { notify_buyer: true, reason: aviso.motivo.trim() || null } : {};
    return this.http.post<PedidoAdmin>(`${this.api}/admin/orders/${numero}/cancel`, cuerpo).pipe(conErrorApi());
  }

  /** El comprobante está en un disco privado y exige sesión: se descarga con el token y se abre como archivo local. */
  comprobante(numero: string): Observable<Blob> {
    return this.http.get(`${this.api}/admin/orders/${numero}/receipt`, { responseType: 'blob' }).pipe(conErrorApi());
  }
}
