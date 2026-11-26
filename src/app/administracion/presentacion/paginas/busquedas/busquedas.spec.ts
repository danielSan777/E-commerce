import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { AdminBusquedas } from './busquedas';

const URL = '/api/v1/admin/searches/no-results';

describe('AdminBusquedas', () => {
  let http: HttpTestingController;

  async function abrir(data: { term: string; times: number; last_at: string }[]) {
    TestBed.configureTestingModule({ imports: [AdminBusquedas], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    http = TestBed.inject(HttpTestingController);
    const f = TestBed.createComponent(AdminBusquedas);
    f.detectChanges();
    const r = http.expectOne(x => x.url === URL);
    expect(r.request.params.get('days')).toBe('30');
    r.flush({ data, meta: { days: 30 } });
    await f.whenStable();
    f.detectChanges();
    return f;
  }
  afterEach(() => http?.verify());

  it('lista cada búsqueda sin resultados con cuántas veces se hizo', async () => {
    const f = await abrir([{ term: 'galapagos', times: 3, last_at: '2026-11-26T12:00:00Z' }, { term: 'unicornio', times: 1, last_at: '2026-11-10T12:00:00Z' }]);
    const filas = (f.nativeElement as HTMLElement).querySelectorAll('tbody tr');

    expect(filas).toHaveLength(2);
    expect(filas[0].textContent).toContain('galapagos');
    expect(filas[0].textContent).toContain('3');
  });

  it('sin búsquedas avisa que no hubo, y cambiar el periodo vuelve a pedir la lista', async () => {
    const f = await abrir([]);
    expect((f.nativeElement as HTMLElement).textContent).toContain('No hubo búsquedas sin resultados');

    f.componentInstance.elegir(90);
    const r = http.expectOne(x => x.url === URL);
    expect(r.request.params.get('days')).toBe('90');
    r.flush({ data: [{ term: 'antigua', times: 2, last_at: '2026-10-01T12:00:00Z' }], meta: { days: 90 } });
    expect(f.componentInstance.busquedas()).toHaveLength(1);
  });
});
