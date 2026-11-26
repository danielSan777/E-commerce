import { firstValueFrom } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../core/configuracion/api';
import { FacturacionAdminService } from './FacturacionAdminService';

describe('FacturacionAdminService', () => {
  let s: FacturacionAdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    s = TestBed.inject(FacturacionAdminService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('lista los pedidos por facturar o ya facturados según el estado pedido', async () => {
    const a = firstValueFrom(s.listar('pending'));
    http.expectOne(r => r.url === '/api/v1/admin/invoicing' && r.params.get('state') === 'pending').flush({ data: [], meta: { pending_count: 0 } });
    expect((await a).meta.pending_count).toBe(0);

    const b = firstValueFrom(s.listar('done'));
    http.expectOne(r => r.params.get('state') === 'done').flush({ data: [], meta: { pending_count: 3 } });
    expect((await b).meta.pending_count).toBe(3);
  });

  it('marca por lote con POST: pedido y número de factura (o null)', async () => {
    const r = firstValueFrom(s.marcar([{ number: 'JDS-1001', invoice_number: '001-001-123' }, { number: 'JDS-1002', invoice_number: null }]));
    const req = http.expectOne('/api/v1/admin/invoicing/batch');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ orders: [{ number: 'JDS-1001', invoice_number: '001-001-123' }, { number: 'JDS-1002', invoice_number: null }] });
    req.flush({ results: [], invoiced: 2 });
    expect((await r).invoiced).toBe(2);
  });

  it('quita la marca con DELETE', async () => {
    const r = firstValueFrom(s.quitar('JDS-1001'));
    const req = http.expectOne('/api/v1/admin/invoicing/JDS-1001');
    expect(req.request.method).toBe('DELETE');
    req.flush({ number: 'JDS-1001', invoiced_at: null });
    expect((await r).number).toBe('JDS-1001');
  });
});
