import { PedidoService, NuevoPedido } from './PedidoService';
import { DatosCheckout } from './CheckoutService';

function nuevo(metodo: 'transferencia' | 'payphone'): NuevoPedido {
    return {
        metodo, items: [], datos: { metodoPago: metodo } as DatosCheckout,
        subtotal: 25, envio: 3.5, envioGratis: false, recargo: 0, total: 28.5,
        entrega: { tipo: 'inmediata', window: { start: '2026-11-12', end: '2026-11-13' }, label: 'x', promise_token: 't' },
        marketing: false,
    };
}

describe('PedidoService.crear', () => {
    it('transferencia: queda pendiente y con 12 horas de plazo', () => {
        const p = new PedidoService().crear(nuevo('transferencia'));
        const horas = (new Date(p.limitePago!).getTime() - new Date(p.fecha).getTime()) / 3600_000;

        expect(p.pagoConfirmado).toBe(false);
        expect(p.pagoSimulado).toBe(false);
        expect(horas).toBe(12);
    });

    it('PayPhone: se marca como pago simulado y no tiene plazo', () => {
        const p = new PedidoService().crear(nuevo('payphone'));

        expect(p.pagoSimulado).toBe(true);
        expect(p.limitePago).toBeNull();
    });
});
