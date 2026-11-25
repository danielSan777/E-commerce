import { firstValueFrom } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../core/configuracion/api';
import { CiclosAdminService } from './CiclosAdminService';

describe('CiclosAdminService', () => {
  let s: CiclosAdminService;
  let http: HttpTestingController;
  const LISTA = { data: [], meta: { nominal_capacity: 8, tolerance: 10, max_capacity: 30 } };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    s = TestBed.inject(CiclosAdminService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('lista los ciclos', async () => {
    const l = firstValueFrom(s.listar());
    http.expectOne('/api/v1/admin/cycles').flush(LISTA);
    expect((await l).meta.nominal_capacity).toBe(8);
  });

  it('cierra y reabre un ciclo con POST y recibe la lista actualizada', async () => {
    const c = firstValueFrom(s.cerrar('2026-11-09'));
    const rc = http.expectOne('/api/v1/admin/cycles/2026-11-09/close');
    expect(rc.request.method).toBe('POST');
    rc.flush(LISTA);
    await c;

    const r = firstValueFrom(s.reabrir('2026-11-09'));
    const rr = http.expectOne('/api/v1/admin/cycles/2026-11-09/reopen');
    expect(rr.request.method).toBe('POST');
    rr.flush(LISTA);
    expect((await r).data).toEqual([]);
  });

  it('cambia la capacidad con PUT, y null vuelve a la nominal', async () => {
    const a = firstValueFrom(s.cambiarCapacidad('2026-11-09', 5));
    const ra = http.expectOne('/api/v1/admin/cycles/2026-11-09/capacity');
    expect(ra.request.method).toBe('PUT');
    expect(ra.request.body).toEqual({ capacity: 5 });
    ra.flush(LISTA);
    await a;

    const b = firstValueFrom(s.cambiarCapacidad('2026-11-09', null));
    const rb = http.expectOne('/api/v1/admin/cycles/2026-11-09/capacity');
    expect(rb.request.body).toEqual({ capacity: null });
    rb.flush(LISTA);
    await b;
  });
});
