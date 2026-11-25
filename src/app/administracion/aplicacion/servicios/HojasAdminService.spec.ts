import { firstValueFrom } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../core/configuracion/api';
import { HojasAdminService } from './HojasAdminService';

describe('HojasAdminService', () => {
  let s: HojasAdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    s = TestBed.inject(HojasAdminService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('pide la hoja de producción y la lista de envíos del ciclo', async () => {
    const p = firstValueFrom(s.produccion('2026-11-09'));
    http.expectOne('/api/v1/admin/cycles/2026-11-09/production').flush({ cycle: {}, orders: [], totals: { orders: 0, planters: 0 } });
    expect((await p).totals.orders).toBe(0);

    const e = firstValueFrom(s.envios('2026-11-09'));
    http.expectOne('/api/v1/admin/cycles/2026-11-09/shipping').flush({ cycle: {}, orders: [] });
    expect((await e).orders).toEqual([]);
  });

  it('envía el lote con POST: pedido y guía', async () => {
    const r = firstValueFrom(s.enviarLote([{ number: 'JDS-1001', tracking_number: 'SERV-10001' }]));
    const req = http.expectOne('/api/v1/admin/orders/ship-batch');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ orders: [{ number: 'JDS-1001', tracking_number: 'SERV-10001' }] });
    req.flush({ results: [{ number: 'JDS-1001', ok: true, message: null }], shipped: 1 });
    expect((await r).shipped).toBe(1);
  });
});
