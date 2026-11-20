import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { conErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { SIN_CARGANDO } from '../../../shared/interceptores/cargandoInterceptor';
import { PedidoPendiente } from '../../dominio/interfaces/pedido_pendiente';
import { PedidoSeguimiento } from '../../dominio/interfaces/seguimiento';

/** Lo que devuelve GET /orders/{token}: pendiente de pago (transferencia) o seguimiento (ya pagado o cancelado). */
export type VistaPedido = PedidoPendiente | PedidoSeguimiento;

export function esSeguimiento(v: VistaPedido): v is PedidoSeguimiento {
    return 'visible_status' in v;
}

/**
 * Lee y actualiza un pedido con su enlace privado (el token largo). Laravel decide el estado, el plazo, las cuentas
 * y el texto del mensaje; Angular solo los muestra.
 */
@Injectable({ providedIn: 'root' })
export class PedidoConsultaService {
    private http = inject(HttpClient);
    private api = inject(API_URL);

    /** `conSpinner`: la pantalla del pedido espera con la pantalla de carga; el aviso de la tienda lo pide en silencio. */
    obtener(token: string, conSpinner = false): Observable<VistaPedido> {
        return this.http.get<VistaPedido>(`${this.api}/orders/${encodeURIComponent(token)}`, { context: new HttpContext().set(SIN_CARGANDO, !conSpinner) })
            .pipe(conErrorApi());
    }

    /** Sube el comprobante (JPG, PNG o PDF de hasta 5 MB) y devuelve el pedido actualizado. */
    subirComprobante(token: string, archivo: File): Observable<VistaPedido> {
        const cuerpo = new FormData();
        cuerpo.append('receipt', archivo);
        return this.http.post<VistaPedido>(`${this.api}/orders/${encodeURIComponent(token)}/receipt`, cuerpo).pipe(conErrorApi());
    }
}
