import { firstValueFrom } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../core/configuracion/api';
import { DiasNoHabilesAdminService } from './DiasNoHabilesAdminService';

describe('DiasNoHabilesAdminService', () => {
  let s: DiasNoHabilesAdminService;
  let http: HttpTestingController;
  const dia = { date: '2026-12-25', type: 'national_holiday' as const, affects_production: true, affects_dispatch: true, affects_delivery: true, note: null };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    s = TestBed.inject(DiasNoHabilesAdminService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('lista los días con el dato del año siguiente', async () => {
    const l = firstValueFrom(s.listar());
    http.expectOne('/api/v1/admin/non-working-days').flush({ data: [dia], meta: { next_year: 2027, national_holidays_next_year: 0 } });
    const r = await l;
    expect(r.data).toEqual([dia]);
    expect(r.meta.national_holidays_next_year).toBe(0);
  });

  it('guarda un día (respuesta con un solo día) y un rango (respuesta con data) y siempre devuelve una lista', async () => {
    const uno = firstValueFrom(s.guardar({ ...dia, end_date: null }));
    const r1 = http.expectOne(r => r.method === 'POST' && r.url === '/api/v1/admin/non-working-days');
    expect(r1.request.body.date).toBe('2026-12-25');
    r1.flush(dia);
    expect(await uno).toEqual([dia]);

    const rango = firstValueFrom(s.guardar({ ...dia, end_date: '2026-12-27' }));
    http.expectOne('/api/v1/admin/non-working-days').flush({ data: [dia, { ...dia, date: '2026-12-26' }, { ...dia, date: '2026-12-27' }] });
    expect((await rango).length).toBe(3);
  });

  it('elimina un día por su fecha', async () => {
    const e = firstValueFrom(s.eliminar('2026-12-25'));
    const r = http.expectOne('/api/v1/admin/non-working-days/2026-12-25');
    expect(r.request.method).toBe('DELETE');
    r.flush(null);
    await e;
  });
});
