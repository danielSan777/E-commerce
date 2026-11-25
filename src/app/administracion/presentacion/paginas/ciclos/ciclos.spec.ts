import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { CicloAdmin, ListaCiclos } from '../../../dominio/interfaces/ciclos-admin';
import { AdminCiclos, capacidadValida } from './ciclos';

const URL = '/api/v1/admin/cycles';

function ciclo(fecha: string, extra: Partial<CicloAdmin> = {}): CicloAdmin {
  return {
    date: fecha, cutoff_at: '2026-11-10T01:00:00Z', dispatch_date: '2026-11-11', window: { start: '2026-11-12', end: '2026-11-13' },
    paid: 0, pending_transfer: 0, card_in_progress: 0, committed: 0, capacity: 8, tolerance_limit: 10, remaining: 8,
    closed: false, capacity_override: null, is_offered: false, last_event: null, ...extra,
  };
}
const lista = (data: CicloAdmin[]): ListaCiclos => ({ data, meta: { nominal_capacity: 8, tolerance: 10, max_capacity: 30 } });

describe('AdminCiclos', () => {
  let http: HttpTestingController;

  async function abrir(data: CicloAdmin[]) {
    TestBed.configureTestingModule({ imports: [AdminCiclos], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminCiclos);
    fixture.detectChanges();
    http.expectOne(URL).flush(lista(data));
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }
  afterEach(() => http?.verify());

  it('la capacidad escrita debe ser un entero de 1 al máximo', () => {
    expect(capacidadValida('5', 30)).toBe(5);
    expect(capacidadValida(' 30 ', 30)).toBe(30);
    for (const mala of ['', '0', '31', '2,5', 'abc', '-1', '1e1']) expect(capacidadValida(mala, 30)).toBeNull();
  });

  it('muestra cada ciclo con pagados, transferencias, tarjetas, comprometidos y lo que queda', async () => {
    const f = await abrir([ciclo('2026-11-09', { paid: 3, pending_transfer: 2, card_in_progress: 1, committed: 6, remaining: 2, is_offered: true }), ciclo('2026-11-10')]);
    const html = f.nativeElement as HTMLElement;
    const primero = html.querySelectorAll('.ciclo')[0];

    expect(html.querySelectorAll('.ciclo')).toHaveLength(2);
    expect(primero.querySelector('.titulo')?.textContent).toContain('lunes 9 de noviembre de 2026');
    const cuentas = Array.from(primero.querySelectorAll('.cuentas div')).map(d => `${d.querySelector('dt')!.textContent!.trim()} ${d.querySelector('dd')!.textContent!.trim()}`);
    expect(cuentas).toEqual(['Pagados 3', 'Transferencias pendientes 2', 'Tarjetas en curso 1', 'Comprometidos 6 de 8', 'Quedan 2']);
    expect(primero.textContent).toContain('Aquí entra el siguiente pedido');
    expect(html.querySelectorAll('.ahora')).toHaveLength(1);
    expect(primero.querySelector('.fechas')?.textContent).toContain('Corte: 9 nov, 20:00');   // 01:00 UTC = 20:00 en Guayaquil
    expect(primero.querySelector('.fechas')?.textContent).toContain('Despacho: miércoles 11 de noviembre');
  });

  it('un ciclo lleno se ve "Lleno" y uno cerrado "Cerrado" con quién lo cerró', async () => {
    const f = await abrir([
      ciclo('2026-11-09', { committed: 8, remaining: 0 }),
      ciclo('2026-11-10', { closed: true, committed: 3, remaining: 0, last_event: { type: 'closed', actor_name: 'Josué', at: '2026-11-09T20:00:00Z', data: { committed: 3 } } }),
    ]);
    const filas = (f.nativeElement as HTMLElement).querySelectorAll('.ciclo');

    expect(filas[0].querySelector('.estado')?.textContent).toBe('Lleno');
    expect(filas[1].querySelector('.estado')?.textContent).toBe('Cerrado');
    expect(filas[1].querySelector('.evento')?.textContent).toContain('Cerrado por Josué');
    expect(filas[1].textContent).toContain('Reabrir ciclo');
    expect(filas[1].textContent).not.toContain('Pasar las ventas');
    expect(filas[1].querySelector<HTMLInputElement>('input')!.disabled).toBe(true);
  });

  it('"Pasar las ventas al siguiente ciclo" pide confirmar y solo entonces llama a la API', async () => {
    const f = await abrir([ciclo('2026-11-09', { committed: 2, remaining: 6, is_offered: true })]);
    const html = f.nativeElement as HTMLElement;
    const boton = () => Array.from(html.querySelectorAll<HTMLButtonElement>('.acciones button')).find(b => b.textContent!.includes('Pasar las ventas'))!;

    boton().click();
    f.detectChanges();
    http.expectNone(`${URL}/2026-11-09/close`);
    expect(html.querySelector('.confirmar')?.textContent).toContain('Los 2 que ya tiene no cambian');

    // "No" cancela
    Array.from(html.querySelectorAll<HTMLButtonElement>('.confirmar button')).find(b => b.textContent!.trim() === 'No')!.click();
    f.detectChanges();
    expect(html.querySelector('.confirmar')).toBeNull();

    boton().click();
    f.detectChanges();
    Array.from(html.querySelectorAll<HTMLButtonElement>('.confirmar button')).find(b => b.textContent!.includes('Sí, pasar'))!.click();
    const r = http.expectOne(`${URL}/2026-11-09/close`);
    expect(r.request.method).toBe('POST');
    r.flush(lista([ciclo('2026-11-09', { closed: true, remaining: 0, committed: 2 }), ciclo('2026-11-10', { is_offered: true })]));
    await f.whenStable();
    f.detectChanges();

    expect(html.querySelectorAll('.ciclo')[0].querySelector('.estado')?.textContent).toBe('Cerrado');
    expect(html.querySelector('.confirmar')).toBeNull();
  });

  it('reabrir un ciclo cerrado llama a la API y muestra la lista nueva', async () => {
    const f = await abrir([ciclo('2026-11-09', { closed: true, remaining: 0 })]);
    const html = f.nativeElement as HTMLElement;
    Array.from(html.querySelectorAll<HTMLButtonElement>('.acciones button')).find(b => b.textContent!.includes('Reabrir'))!.click();

    const r = http.expectOne(`${URL}/2026-11-09/reopen`);
    expect(r.request.method).toBe('POST');
    r.flush(lista([ciclo('2026-11-09', { is_offered: true })]));
    await f.whenStable();
    f.detectChanges();

    expect(html.querySelector('.estado')?.textContent).toBe('Abierto');
  });

  it('guarda la capacidad de un ciclo puntual y avisa si no es un número válido', async () => {
    const f = await abrir([ciclo('2026-11-09')]);
    const c = f.componentInstance;
    const html = f.nativeElement as HTMLElement;

    c.escribir('2026-11-09', '0');
    c.guardarCapacidad(c.lista()!.data[0], new Event('submit'));
    f.detectChanges();
    http.expectNone({ method: 'PUT', url: `${URL}/2026-11-09/capacity` });
    expect(html.textContent).toContain('Escribe un número entero de 1 a 30.');

    c.escribir('2026-11-09', '5');
    c.guardarCapacidad(c.lista()!.data[0], new Event('submit'));
    const r = http.expectOne(`${URL}/2026-11-09/capacity`);
    expect(r.request.body).toEqual({ capacity: 5 });
    r.flush(lista([ciclo('2026-11-09', { capacity: 5, capacity_override: 5, remaining: 5, last_event: { type: 'capacity_changed', actor_name: 'Josué', at: '2026-11-09T15:00:00Z', data: { from: null, to: 5 } } })]));
    await f.whenStable();
    f.detectChanges();

    expect(html.querySelector('.nota')?.textContent).toContain('la normal es 8');
    expect(html.querySelector('.evento')?.textContent).toContain('Capacidad cambiada a 5 por Josué');
    expect(html.querySelector<HTMLInputElement>('input')!.value).toBe('5');
    expect(html.textContent).toContain('Usar la normal');
  });

  it('"Usar la normal" manda capacity null', async () => {
    const f = await abrir([ciclo('2026-11-09', { capacity: 5, capacity_override: 5, remaining: 5 })]);
    Array.from((f.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.capacidad button')).find(b => b.textContent!.includes('Usar la normal'))!.click();

    const r = http.expectOne(`${URL}/2026-11-09/capacity`);
    expect(r.request.body).toEqual({ capacity: null });
    r.flush(lista([ciclo('2026-11-09')]));
  });

  it('si Laravel rechaza la acción, no cambia la pantalla y se puede reintentar', async () => {
    const f = await abrir([ciclo('2026-11-09')]);
    const c = f.componentInstance;
    c.cerrar(c.lista()!.data[0]);
    http.expectOne(`${URL}/2026-11-09/close`).flush({ code: 'cycle_already_closed', message: 'Ese ciclo ya está cerrado.' }, { status: 409, statusText: 'Conflict' });
    await f.whenStable();

    expect(c.lista()!.data[0].closed).toBe(false);
    expect(c.ocupado()).toBeNull();
  });
});
