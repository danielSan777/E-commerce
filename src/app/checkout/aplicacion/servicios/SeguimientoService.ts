import { Injectable } from '@angular/core';
import { Pedido } from './PedidoService';
import { PedidoSeguimiento } from '../../dominio/interfaces/seguimiento';

// MOCK (Paso 0): arma, a partir del pedido guardado en el navegador, la misma respuesta que dará Laravel en
// GET /api/v1/orders/{token} cuando el pedido está pagado. Con backend solo cambia el cuerpo de `desdePedido`.
// Hoy el estado visible es siempre "confirmado": producción y envío los marca Josué en el panel (Paso 17).
@Injectable({ providedIn: 'root' })
export class SeguimientoService {

    desdePedido(p: Pedido): PedidoSeguimiento {
        return {
            order_number: p.numero,
            visible_status: 'confirmado',
            payment: {
                method: p.metodo === 'transferencia' ? 'transfer' : 'card',
                status: 'paid',
                paid_at: p.fecha,
            },
            window: p.entrega.window,
            shipment: { carrier: 'Servientrega', tracking_number: null },
            items: p.items
                .filter(i => i.tipo === 'personalizado')
                .map(i => ({ name: i.producto.nombre, name_text: i.configuracion?.nombre?.trim() || null })),
            total_cents: Math.round(p.total * 100),
        };
    }
}
