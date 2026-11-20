import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { conErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { IntentoDePago, RespuestaDelPago } from '../../dominio/interfaces/pago_tarjeta';

/** Pago con tarjeta (Paso 13). Laravel crea el intento y confirma con PayPhone; aquí solo se pide y se muestra. */
@Injectable({ providedIn: 'root' })
export class PagoTarjetaService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  /** Intento activo del pedido (el mismo mientras no venza) y los datos de la Cajita. */
  iniciar(token: string): Observable<IntentoDePago> {
    return this.http.post<IntentoDePago>(`${this.api}/orders/${token}/payphone`, {}).pipe(conErrorApi());
  }

  /** Lo que PayPhone devolvió en la URL de respuesta (`id` y `clientTransactionId`). Laravel confirma y decide. */
  confirmar(id: number, clientTransactionId: string): Observable<RespuestaDelPago> {
    return this.http.post<RespuestaDelPago>(`${this.api}/payments/payphone/confirm`, { id, client_transaction_id: clientTransactionId }).pipe(conErrorApi());
  }
}
