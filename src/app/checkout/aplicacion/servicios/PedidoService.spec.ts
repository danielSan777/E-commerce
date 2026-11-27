import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../core/configuracion/api';
import { CHECKOUT_API, TOKEN_PRUEBA } from '../../../testing/pedido-api';
import { ErrorApi } from '../../../cuenta/dominio/interfaces/sesion';
import { PedidoPendienteRecordadoService } from './PedidoPendienteRecordadoService';
import { PedidoService, NuevoPedido } from './PedidoService';
import { DatosCheckout } from './CheckoutService';

function nuevo(metodo: 'transferencia' | 'payphone'): NuevoPedido {
    return {
        metodo, items: [], datos: { metodoPago: metodo, provincia: 'Guayas', canton: 'Durán' } as DatosCheckout,
        subtotal: 25, envio: 3.5, envioGratis: false, recargo: 0, total: 28.5,
        entrega: { tipo: 'inmediata', window: { start: '2026-11-12', end: '2026-11-13' }, label: 'x', promise_token: 't' },
    };
}

describe('PedidoService.crear', () => {
    let http: HttpTestingController;
    let servicio: PedidoService;

    beforeEach(() => {
        sessionStorage.clear();
        localStorage.clear();
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
        http = TestBed.inject(HttpTestingController);
        servicio = TestBed.inject(PedidoService);
    });

    afterEach(() => http.verify());

    it('transferencia: avisa place_order con los datos de Laravel; con tarjeta no (la compra se mide al aprobarse el cobro)', () => {
        const capa = () => (window as unknown as { dataLayer: { event: string }[] }).dataLayer;
        (window as unknown as { dataLayer: unknown[] }).dataLayer = [];

        servicio.crear(nuevo('transferencia')).subscribe();
        http.expectOne('/api/v1/checkout').flush(CHECKOUT_API, { status: 201, statusText: 'Created' });
        expect(capa()).toEqual([{ event: 'place_order', payment_type: 'transfer', event_id: 'evt-1', transaction_id: 'JDS-48213', currency: 'USD', value: 25, items: [{ item_id: 'MAC-001', item_name: 'Doctor', price: 25, quantity: 1 }] }]);

        (window as unknown as { dataLayer: unknown[] }).dataLayer = [];
        servicio.crear(nuevo('payphone')).subscribe();
        http.expectOne('/api/v1/checkout').flush(CHECKOUT_API, { status: 201, statusText: 'Created' });
        expect(capa()).toEqual([]);
    });

    it('transferencia: Laravel crea el pedido y devuelve número, token y plazo', () => {
        let creado: ReturnType<PedidoService['pedido']> = null;
        servicio.crear(nuevo('transferencia')).subscribe(p => (creado = p));

        const peticion = http.expectOne('/api/v1/checkout');
        expect(peticion.request.method).toBe('POST');
        expect(peticion.request.body.payment_method).toBe('transfer');
        expect(peticion.request.body.expected_total_cents).toBe(2850);
        peticion.flush(CHECKOUT_API, { status: 201, statusText: 'Created' });

        expect(creado!.numero).toBe('JDS-48213');
        expect(creado!.token).toBe(TOKEN_PRUEBA);
        expect(creado!.limitePago).toBe(CHECKOUT_API.order.deadline_at);
        expect(creado!.pagoConfirmado).toBe(false);
        expect(creado!.pendiente?.whatsapp_message).toContain(`/pedido/${TOKEN_PRUEBA}`);
        expect(servicio.pedido()?.token).toBe(TOKEN_PRUEBA);
        // queda recordado para volver al pedido aunque se cierre la pestaña
        expect(TestBed.inject(PedidoPendienteRecordadoService).pedido()).toMatchObject({ numero: 'JDS-48213', token: TOKEN_PRUEBA });
    });

    it('si Laravel rechaza (price_changed) no guarda ningún pedido y entrega el total nuevo', () => {
        let error: ErrorApi | undefined;
        servicio.crear(nuevo('transferencia')).subscribe({ error: e => (error = e) });

        http.expectOne('/api/v1/checkout').flush(
            { code: 'price_changed', message: 'Actualizamos el total.', details: { total_cents: 3100 } },
            { status: 409, statusText: 'Conflict' });

        expect(error?.code).toBe('price_changed');
        expect(error?.details?.['total_cents']).toBe(3100);
        expect(servicio.pedido()).toBeNull();
    });

    it('PayPhone: Laravel crea el pedido con tarjeta SIN pagar; solo la confirmación del cobro lo marca pagado', () => {
        let creado: ReturnType<PedidoService['pedido']> = null;
        servicio.crear(nuevo('payphone')).subscribe(p => (creado = p));

        const r = http.expectOne('/api/v1/checkout');
        expect(r.request.body.payment_method).toBe('card');
        expect(r.request.body.expected_total_cents).toBe(2850);
        r.flush(CHECKOUT_API, { status: 201, statusText: 'Created' });

        expect(creado!.metodo).toBe('payphone');
        expect(creado!.pagoConfirmado).toBe(false);
        expect(creado!.pagoSimulado).toBe(false);
        expect(creado!.limitePago).toBeNull();
        expect(creado!.pendiente).toBeNull();
        expect(localStorage.getItem('jds_pedido_pendiente')).toBeNull(); // todavía no hay pago que recordar

        expect(servicio.marcarPagadoConTarjeta('OTRO-1', false)).toBe(false);
        expect(servicio.marcarPagadoConTarjeta(creado!.numero, true)).toBe(true);
        expect(servicio.pedido()!.pagoConfirmado).toBe(true);
        expect(servicio.pedido()!.pagoSimulado).toBe(true);
    });
});
