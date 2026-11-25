import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { AdminFeriados, fechaLarga, validarDia } from './feriados';

const NAVIDAD = { date: '2026-12-25', type: 'national_holiday', affects_production: true, affects_dispatch: true, affects_delivery: true, note: null };
const CIERRE = { date: '2027-01-04', type: 'closure', affects_production: true, affects_dispatch: true, affects_delivery: false, note: 'Viaje' };
const URL = '/api/v1/admin/non-working-days';

describe('AdminFeriados', () => {
  let http: HttpTestingController;

  async function abrir(dias: object[] = [NAVIDAD, CIERRE], proximo = 1) {
    TestBed.configureTestingModule({ imports: [AdminFeriados], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminFeriados);
    fixture.detectChanges();
    http.expectOne(URL).flush({ data: dias, meta: { today: '2026-11-25', next_year: 2027, national_holidays_next_year: proximo } });
    await fixture.whenStable();
    return fixture;
  }
  afterEach(() => http?.verify());

  it('escribe la fecha como la ve una persona', () => {
    expect(fechaLarga('2026-12-25')).toBe('viernes 25 de diciembre de 2026');
    expect(fechaLarga('2027-01-04')).toBe('lunes 4 de enero de 2027');
  });

  it('valida: fecha obligatoria, rango en orden, algo a lo que afecte y nota corta', () => {
    const ok = { desde: '2026-12-01', hasta: '', tipo: 'closure' as const, produccion: true, despacho: false, entrega: false, nota: '' };
    expect(validarDia(ok)).toEqual({});
    expect(validarDia({ ...ok, desde: '' })['desde']).toBeTruthy();
    expect(validarDia(ok, '2026-12-02')['desde']).toBe('No puedes bloquear un día que ya pasó.');
    expect(validarDia(ok, '2026-12-01')).toEqual({});   // hoy sí se puede
    expect(validarDia({ ...ok, hasta: '2026-11-30' })['hasta']).toBeTruthy();
    expect(validarDia({ ...ok, produccion: false })['afecta']).toBeTruthy();
    expect(validarDia({ ...ok, nota: 'x'.repeat(151) })['nota']).toBeTruthy();
  });

  it('lista los días agrupados por año, con su tipo y a qué afectan', async () => {
    const html = (await abrir()).nativeElement as HTMLElement;

    expect(Array.from(html.querySelectorAll('h3')).map(h => h.textContent)).toEqual(['2026', '2027']);
    const filas = html.querySelectorAll('.lista li');
    expect(filas).toHaveLength(2);
    expect(filas[0].textContent).toContain('viernes 25 de diciembre de 2026');
    expect(filas[0].textContent).toContain('Feriado nacional');
    expect(filas[0].textContent).toContain('producción, despacho, entrega');
    expect(filas[1].textContent).toContain('Cierre propio');
    expect(filas[1].textContent).toContain('producción, despacho');
    expect(filas[1].textContent).not.toContain('entrega,');
    expect(filas[1].textContent).toContain('Viaje');
  });

  it('avisa si el año que viene no tiene feriados nacionales cargados, y no avisa si ya hay', async () => {
    expect(((await abrir([], 0)).nativeElement as HTMLElement).querySelector('.aviso')?.textContent).toContain('No hay feriados nacionales cargados para 2027');
    http.verify();
    TestBed.resetTestingModule();
    expect(((await abrir([NAVIDAD], 1)).nativeElement as HTMLElement).querySelector('.aviso')).toBeNull();
  });

  it('los selectores de fecha no dejan elegir días anteriores a hoy (el de "hasta", tampoco antes del "desde")', async () => {
    const f = await abrir();
    const html = f.nativeElement as HTMLElement;
    const desde = html.querySelector<HTMLInputElement>('#fer-desde')!;
    const hasta = html.querySelector<HTMLInputElement>('#fer-hasta')!;

    expect(desde.min).toBe('2026-11-25');
    expect(hasta.min).toBe('2026-11-25');

    f.componentInstance.poner('desde', '2026-12-10');
    f.detectChanges();
    expect(hasta.min).toBe('2026-12-10');
  });

  it('un día que ya pasó, aunque lo escriban a mano, no llama a la API', async () => {
    const f = await abrir();
    f.componentInstance.poner('desde', '2025-02-06');
    f.componentInstance.poner('hasta', '2026-01-01');
    f.componentInstance.guardar(new Event('submit'));
    await f.whenStable();
    f.detectChanges();

    http.expectNone({ method: 'POST', url: URL });
    expect((f.nativeElement as HTMLElement).textContent).toContain('No puedes bloquear un día que ya pasó.');
  });

  it('sin fecha no llama a la API', async () => {
    const f = await abrir();
    (f.nativeElement as HTMLElement).querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    await f.whenStable();

    http.expectNone({ method: 'POST', url: URL });
    expect((f.nativeElement as HTMLElement).textContent).toContain('Elige la fecha.');
  });

  it('guarda un rango con tipo, a qué afecta y nota, y vuelve a cargar la lista', async () => {
    const f = await abrir();
    const c = f.componentInstance;
    c.poner('desde', '2026-12-28');
    c.poner('hasta', '2026-12-30');
    c.poner('tipo', 'closure');
    c.poner('entrega', false);
    c.poner('nota', '  Viaje  ');
    c.guardar(new Event('submit'));

    const post = http.expectOne(r => r.method === 'POST' && r.url === URL);
    expect(post.request.body).toEqual({ date: '2026-12-28', end_date: '2026-12-30', type: 'closure', affects_production: true, affects_dispatch: true, affects_delivery: false, note: 'Viaje' });
    post.flush({ data: [] }, { status: 201, statusText: 'Created' });
    http.expectOne(URL).flush({ data: [NAVIDAD], meta: { today: '2026-11-25', next_year: 2027, national_holidays_next_year: 1 } });
    await f.whenStable();

    expect(c.formulario().desde).toBe('');   // el formulario queda limpio
  });

  it('un solo día se manda sin fecha final', async () => {
    const f = await abrir();
    f.componentInstance.poner('desde', '2026-12-31');
    f.componentInstance.poner('hasta', '2026-12-31');
    f.componentInstance.guardar(new Event('submit'));

    const post = http.expectOne(r => r.method === 'POST' && r.url === URL);
    expect(post.request.body.end_date).toBeNull();
    post.flush({ ...NAVIDAD, date: '2026-12-31' }, { status: 201, statusText: 'Created' });
    http.expectOne(URL).flush({ data: [], meta: { today: '2026-11-25', next_year: 2027, national_holidays_next_year: 1 } });
  });

  it('quitar un día lo borra por su fecha y refresca', async () => {
    const f = await abrir();
    f.componentInstance.quitar(f.componentInstance.dias()[0]);

    const del = http.expectOne(`${URL}/2026-12-25`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null, { status: 204, statusText: 'No Content' });
    http.expectOne(URL).flush({ data: [CIERRE], meta: { today: '2026-11-25', next_year: 2027, national_holidays_next_year: 0 } });
    await f.whenStable();

    expect(f.componentInstance.dias()).toHaveLength(1);
  });
});
