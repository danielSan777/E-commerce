import { Injectable } from '@angular/core';
import { Pedido } from './PedidoService';
import { PedidoPendiente } from '../../dominio/interfaces/pedido_pendiente';
import { CUENTAS, TITULAR_TRANSFERENCIA } from '../../dominio/interfaces/datos_transferencia';
import { etiquetaLimite } from '../../dominio/validaciones/fechas';
import { urlWhatsapp } from '../../dominio/validaciones/mensaje_whatsapp';

// MOCK (Paso 0): arma, a partir del pedido guardado en el navegador, la misma respuesta que dará Laravel en
// GET /api/v1/orders/{token}. Cuando exista el backend, solo cambia el cuerpo de `desdePedido` por la llamada a
// la API; la pantalla no se toca. Aquí (y no en la pantalla) se decide el estado y se escribe la etiqueta del plazo.
@Injectable({ providedIn: 'root' })
export class PedidoPendienteService {

    desdePedido(p: Pedido, ahora = Date.now()): PedidoPendiente {
        const limite = p.limitePago ?? p.fecha;

        return {
            order_number: p.numero,
            status: new Date(limite).getTime() <= ahora ? 'expired' : 'pending_payment',
            total_cents: Math.round(p.total * 100),
            deadline_at: limite,
            deadline_label: etiquetaLimite(limite),
            window: p.entrega.window,
            bank_accounts: CUENTAS.map(c => ({
                bank: c.banco,
                type: c.tipo,
                number: c.numero,
                holder: TITULAR_TRANSFERENCIA.titular,
                id_number: TITULAR_TRANSFERENCIA.cedula,
            })),
            receipt: { uploaded: !!p.comprobante },
            whatsapp_url: urlWhatsapp(p),   // con backend: el endpoint propio que registra el clic
        };
    }
}
