import { firstValueFrom } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../core/configuracion/api';
import { EnviosAdminService } from './EnviosAdminService';

describe('EnviosAdminService', () => {
  let s: EnviosAdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    s = TestBed.inject(EnviosAdminService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('lista zonas y cantones', async () => {
    const z = firstValueFrom(s.zonas());
    http.expectOne('/api/v1/admin/shipping/zones').flush({ data: [{ code: 'A', name: 'Zona A', price_cents: 350, extra_days: 0, is_available: true, cantons_count: 5 }] });
    expect((await z)[0].price_cents).toBe(350);

    const c = firstValueFrom(s.cantones());
    http.expectOne('/api/v1/admin/shipping/cantons').flush({ data: [] });
    expect(await c).toEqual([]);
  });

  it('guarda la zona con PUT y asigna cantones en bloque', async () => {
    const a = firstValueFrom(s.actualizarZona('C', { price_cents: 550, extra_days: 0, is_available: true }));
    const put = http.expectOne('/api/v1/admin/shipping/zones/C');
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ price_cents: 550, extra_days: 0, is_available: true });
    put.flush({ code: 'C', name: 'Zona C', price_cents: 550, extra_days: 0, is_available: true });
    expect((await a).price_cents).toBe(550);

    const b = firstValueFrom(s.asignarZona('A', ['0101', '0102']));
    const masiva = http.expectOne('/api/v1/admin/shipping/cantons/zone');
    expect(masiva.request.body).toEqual({ zone: 'A', cantons: ['0101', '0102'] });
    masiva.flush({ updated: 2 });
    expect(await b).toBe(2);
  });
});
