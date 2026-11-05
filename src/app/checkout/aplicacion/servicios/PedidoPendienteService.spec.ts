import { Pedido } from './PedidoService';
import { PedidoPendienteService } from './PedidoPendienteService';
import { etiquetaLimite } from '../../dominio/validaciones/fechas';

function pedido(limitePago: string | null, comprobante = false): Pedido {
    return {
        numero: 'JDS-2049', token: 't', fecha: '2026-11-09T19:50:00-05:00', metodo: 'transferencia',
        pagoConfirmado: false, pagoSimulado: false, limitePago,
        entrega: { tipo: 'inmediata', window: { start: '2026-11-12', end: '2026-11-13' }, label: 'x', promise_token: 't' },
        comprobante: comprobante ? { nombre: 'pago.jpg', subidoEn: '2026-11-10T11:00:00Z' } : null,
        items: [], datos: {} as Pedido['datos'], subtotal: 47.5, envio: 2.5, envioGratis: false, recargo: 0, total: 50,
    };
}

describe('PedidoPendienteService (mock del contrato "Pedido pendiente de pago")', () => {
    const servicio = new PedidoPendienteService();

    it('trae exactamente los campos del contrato, con el dinero en centavos', () => {
        const v = servicio.desdePedido(pedido('2026-11-10T12:50:00Z'), Date.parse('2026-11-10T00:00:00Z'));

        expect(Object.keys(v).sort()).toEqual([
            'bank_accounts', 'deadline_at', 'deadline_label', 'order_number', 'receipt', 'status',
            'total_cents', 'whatsapp_url', 'window',
        ]);
        expect(v.total_cents).toBe(5000);
        expect(Object.keys(v.bank_accounts[0]).sort()).toEqual(['bank', 'holder', 'id_number', 'number', 'type']);
        expect(v.bank_accounts).toHaveLength(3);
    });

    it('antes del plazo está pendiente de pago; pasado el plazo, vencido', () => {
        const limite = '2026-11-10T12:50:00Z';

        expect(servicio.desdePedido(pedido(limite), Date.parse('2026-11-10T12:49:00Z')).status).toBe('pending_payment');
        expect(servicio.desdePedido(pedido(limite), Date.parse('2026-11-10T12:50:00Z')).status).toBe('expired');
    });

    it('la etiqueta del plazo sale en hora de Guayaquil: "Paga antes del martes 10 de noviembre, 07:50"', () => {
        expect(etiquetaLimite('2026-11-10T12:50:00Z')).toBe('Paga antes del martes 10 de noviembre, 07:50');
    });

    it('el comprobante subido se refleja en receipt.uploaded', () => {
        expect(servicio.desdePedido(pedido('2026-11-10T12:50:00Z')).receipt.uploaded).toBe(false);
        expect(servicio.desdePedido(pedido('2026-11-10T12:50:00Z', true)).receipt.uploaded).toBe(true);
    });
});
