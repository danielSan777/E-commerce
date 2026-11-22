import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../core/configuracion/api';
import { ErrorApi } from '../../../cuenta/dominio/interfaces/sesion';
import { PagoTarjetaService } from './PagoTarjetaService';

describe('PagoTarjetaService', () => {
  let http: HttpTestingController;
  let servicio: PagoTarjetaService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    http = TestBed.inject(HttpTestingController);
    servicio = TestBed.inject(PagoTarjetaService);
  });

  it('iniciar pide una referencia nueva (PayPhone no acepta mostrar dos veces la misma) por el token del pedido', () => {
    let r: unknown;
    servicio.iniciar('tok').subscribe(x => (r = x));
    const q = http.expectOne('/api/v1/orders/tok/payphone');
    expect(q.request.method).toBe('POST');
    expect(q.request.body).toEqual({ renew: true });
    q.flush({ client_transaction_id: 'JDS-1001-1', expires_at: 'x', simulated: true, box: null });
    expect((r as { client_transaction_id: string }).client_transaction_id).toBe('JDS-1001-1');
  });

  it('confirmar envía solo id y la referencia que devolvió PayPhone (nada de montos)', () => {
    servicio.confirmar(77, 'JDS-1001-1').subscribe();
    const q = http.expectOne('/api/v1/payments/payphone/confirm');
    expect(q.request.body).toEqual({ id: 77, client_transaction_id: 'JDS-1001-1' });
    q.flush({ result: 'approved' });
  });

  it('un error de Laravel llega con su código y mensaje', () => {
    let e: ErrorApi | undefined;
    servicio.iniciar('tok').subscribe({ error: x => (e = x) });
    http.expectOne('/api/v1/orders/tok/payphone').flush({ code: 'order_closed', message: 'Este pedido venció.' }, { status: 409, statusText: 'Conflict' });
    expect(e?.code).toBe('order_closed');
  });
});
