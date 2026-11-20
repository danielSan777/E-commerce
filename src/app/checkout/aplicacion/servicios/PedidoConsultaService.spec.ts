import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../core/configuracion/api';
import { SIN_CARGANDO } from '../../../shared/interceptores/cargandoInterceptor';
import { PENDIENTE_API, SEGUIMIENTO_API, TOKEN_PRUEBA } from '../../../testing/pedido-api';
import { PedidoConsultaService, esSeguimiento } from './PedidoConsultaService';

describe('PedidoConsultaService', () => {
    let http: HttpTestingController;
    let servicio: PedidoConsultaService;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
        http = TestBed.inject(HttpTestingController);
        servicio = TestBed.inject(PedidoConsultaService);
    });

    afterEach(() => http.verify());

    it('lee el pedido por su token', () => {
        let vista;
        servicio.obtener(TOKEN_PRUEBA).subscribe(v => (vista = v));
        http.expectOne(`/api/v1/orders/${TOKEN_PRUEBA}`).flush(PENDIENTE_API);

        expect(vista).toEqual(PENDIENTE_API);
    });

    it('la pantalla del pedido muestra el spinner; el aviso de la tienda lo pide en silencio', () => {
        servicio.obtener(TOKEN_PRUEBA, true).subscribe();
        const conSpinner = http.expectOne(`/api/v1/orders/${TOKEN_PRUEBA}`);
        expect(conSpinner.request.context.get(SIN_CARGANDO)).toBe(false);
        conSpinner.flush(PENDIENTE_API);

        servicio.obtener(TOKEN_PRUEBA).subscribe();
        const enSilencio = http.expectOne(`/api/v1/orders/${TOKEN_PRUEBA}`);
        expect(enSilencio.request.context.get(SIN_CARGANDO)).toBe(true);
        enSilencio.flush(PENDIENTE_API);
    });

    it('distingue el pedido pendiente del seguimiento', () => {
        expect(esSeguimiento(PENDIENTE_API)).toBe(false);
        expect(esSeguimiento(SEGUIMIENTO_API)).toBe(true);
    });

    it('sube el comprobante como multipart en el campo "receipt"', () => {
        const archivo = new File(['x'], 'pago.pdf', { type: 'application/pdf' });
        servicio.subirComprobante(TOKEN_PRUEBA, archivo).subscribe();

        const r = http.expectOne(`/api/v1/orders/${TOKEN_PRUEBA}/receipt`);
        expect(r.request.method).toBe('POST');
        expect((r.request.body as FormData).get('receipt')).toBeInstanceOf(File);
        r.flush({ ...PENDIENTE_API, receipt: { uploaded: true } });
    });

    it('un 404 llega como ErrorApi con status 404', () => {
        let status = 0;
        servicio.obtener('x').subscribe({ error: e => (status = e.status) });
        http.expectOne('/api/v1/orders/x').flush({ code: 'not_found', message: 'No encontramos ese pedido.' }, { status: 404, statusText: 'Not Found' });

        expect(status).toBe(404);
    });
});
