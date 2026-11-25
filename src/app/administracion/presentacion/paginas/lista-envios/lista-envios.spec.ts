import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { ListaDeEnvios, PedidoParaEnvio } from '../../../dominio/interfaces/hojas-admin';
import { AdminListaEnvios, guiaValida } from './lista-envios';

const URL = '/api/v1/admin/cycles/2026-11-09/shipping';
const LOTE = '/api/v1/admin/orders/ship-batch';

const envio = (numero: string, extra: Partial<PedidoParaEnvio> = {}): PedidoParaEnvio => ({
  number: numero, status: 'in_production', name: 'Josué de Santis', id_type: 'cedula', id_number: '0930247994', phone: '099 123 4567',
  province: 'Guayas', canton: 'Guayaquil', address: 'Av. Principal 123', reference: 'Frente al parque',
  window: { start: '2026-11-12', end: '2026-11-13' }, tracking_number: null, ...extra,
});
const lista = (orders: PedidoParaEnvio[]): ListaDeEnvios => ({ cycle: { date: '2026-11-09', dispatch_date: '2026-11-11', window: { start: '2026-11-12', end: '2026-11-13' } }, orders });

describe('AdminListaEnvios', () => {
  let http: HttpTestingController;

  async function abrir(orders: PedidoParaEnvio[]) {
    TestBed.configureTestingModule({
      imports: [AdminListaEnvios],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ fecha: '2026-11-09' }) } } }],
    });
    http = TestBed.inject(HttpTestingController);
    const f = TestBed.createComponent(AdminListaEnvios);
    f.detectChanges();
    http.expectOne(URL).flush(lista(orders));
    await f.whenStable();
    f.detectChanges();
    return f;
  }
  afterEach(() => http?.verify());

  it('la guía acepta letras, números y guiones de 5 a 40 caracteres', () => {
    for (const buena of ['SERV-10001', '0012345678', 'abcde', ' ABC-123 ']) expect(guiaValida(buena)).toBe(true);
    for (const mala of ['', 'abcd', 'mala guia!', 'ñandú12345', 'a'.repeat(41)]) expect(guiaValida(mala)).toBe(false);
  });

  it('muestra por pedido destinatario, documento, celular, provincia, cantón, dirección y referencia', async () => {
    const f = await abrir([envio('JDS-1001'), envio('JDS-1002', { id_type: 'ruc', id_number: '0990000000001' })]);
    const filas = (f.nativeElement as HTMLElement).querySelectorAll('.envio');

    expect(filas).toHaveLength(2);
    const t = filas[0].textContent!;
    expect(t).toContain('JDS-1001');
    expect(t).toContain('Josué de Santis');
    expect(t).toContain('Cédula 0930247994');
    expect(t).toContain('Cel. 099 123 4567');
    expect(t).toContain('Guayas, Guayaquil');
    expect(t).toContain('Av. Principal 123');
    expect(t).toContain('Frente al parque');
    expect(filas[1].textContent).toContain('RUC 0990000000001');
  });

  it('marca por defecto los que faltan por enviar y deja sin marcar los ya enviados, con su guía', async () => {
    const f = await abrir([envio('JDS-1001'), envio('JDS-1002', { status: 'shipped', tracking_number: 'SERV-10002' })]);
    const html = f.nativeElement as HTMLElement;
    const marcas = Array.from(html.querySelectorAll<HTMLInputElement>('.incluir input')).map(i => i.checked);

    expect(marcas).toEqual([true, false]);
    expect(html.querySelectorAll('.estado')[1].textContent).toBe('Enviado');
    expect(html.querySelector<HTMLInputElement>('#guia-JDS-1002')!.value).toBe('SERV-10002');
  });

  it('"Copiar datos" copia los datos de la fila para crear la guía', async () => {
    const f = await abrir([envio('JDS-1001')]);
    const copiar = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: copiar }, configurable: true });

    Array.from((f.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.guia button')).find(b => b.textContent!.includes('Copiar datos'))!.click();
    await f.whenStable();

    expect(copiar).toHaveBeenCalledWith('Josué de Santis\nCédula 0930247994\nCel. 099 123 4567\nGuayas, Guayaquil\nAv. Principal 123\nRef.: Frente al parque');
  });

  it('exporta a CSV solo los pedidos marcados, con la guía escrita', async () => {
    const f = await abrir([envio('JDS-1001'), envio('JDS-1002')]);
    const c = f.componentInstance;
    let contenido = '';
    let nombre = '';
    (globalThis.URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL = (b: Blob) => { b.text().then(t => contenido = t); return 'blob:x'; };
    (globalThis.URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = () => undefined;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { nombre = this.download; });

    c.alternar(c.lista()!.orders[1]);   // quita JDS-1002
    c.escribirGuia('JDS-1001', ' SERV-10001 ');
    c.exportarCsv();
    await new Promise(r => setTimeout(r));

    expect(nombre).toBe('envios-2026-11-09.csv');
    expect(contenido).toContain('Pedido;Destinatario;Tipo de documento;Documento;Celular;Provincia;Cantón;Dirección;Referencia;Entrega desde;Entrega hasta;Guía');
    expect(contenido).toContain('JDS-1001;Josué de Santis;Cédula;0930247994;099 123 4567;Guayas;Guayaquil;Av. Principal 123;Frente al parque;2026-11-12;2026-11-13;SERV-10001');
    expect(contenido).not.toContain('JDS-1002');
  });

  it('marcar como enviados pide confirmar y manda solo los marcados con guía válida', async () => {
    const f = await abrir([envio('JDS-1001'), envio('JDS-1002'), envio('JDS-1003')]);
    const c = f.componentInstance;
    const html = f.nativeElement as HTMLElement;
    c.escribirGuia('JDS-1001', 'SERV-10001');
    c.escribirGuia('JDS-1003', 'SERV-10003');
    c.alternar(c.lista()!.orders[2]);   // JDS-1003 desmarcado: no sale aunque tenga guía
    f.detectChanges();

    expect(html.querySelector('.lote button')!.textContent).toContain('Marcar como enviados (1)');
    expect(html.querySelector('.aviso')?.textContent).toContain('1 pedido(s) marcado(s) todavía sin guía');   // JDS-1002

    c.pedirConfirmacion();
    f.detectChanges();
    http.expectNone(LOTE);
    expect(html.querySelector('.confirmar')?.textContent).toContain('¿Marcar 1 pedido(s) como enviado(s)?');

    Array.from(html.querySelectorAll<HTMLButtonElement>('.confirmar button')).find(b => b.textContent!.includes('Sí, marcar'))!.click();
    const r = http.expectOne(LOTE);
    expect(r.request.body).toEqual({ orders: [{ number: 'JDS-1001', tracking_number: 'SERV-10001' }] });
    r.flush({ results: [{ number: 'JDS-1001', ok: true, message: null }], shipped: 1 });
    http.expectOne(URL).flush(lista([envio('JDS-1001', { status: 'shipped', tracking_number: 'SERV-10001' }), envio('JDS-1002'), envio('JDS-1003')]));
    await f.whenStable();
    f.detectChanges();

    expect(html.querySelectorAll('.estado')[0].textContent).toBe('Enviado');
    expect(html.querySelector('.resultado')).toBeNull();
  });

  it('una guía mal escrita se rechaza antes de llamar a la API', async () => {
    const f = await abrir([envio('JDS-1001')]);
    const c = f.componentInstance;
    c.escribirGuia('JDS-1001', 'mala guia!');
    f.detectChanges();

    expect((f.nativeElement as HTMLElement).querySelector('#guia-JDS-1001')!.getAttribute('aria-invalid')).toBe('true');
    c.pedirConfirmacion();
    f.detectChanges();
    http.expectNone(LOTE);
    expect(c.confirmando()).toBe(false);
  });

  it('si algún pedido no pudo enviarse, muestra cuál y por qué', async () => {
    const f = await abrir([envio('JDS-1001'), envio('JDS-1002')]);
    const c = f.componentInstance;
    c.escribirGuia('JDS-1001', 'SERV-10001');
    c.escribirGuia('JDS-1002', 'SERV-10002');
    c.pedirConfirmacion();
    c.marcarEnviados();

    http.expectOne(LOTE).flush({ results: [{ number: 'JDS-1001', ok: true, message: null }, { number: 'JDS-1002', ok: false, message: 'Primero marca el pedido como pagado.' }], shipped: 1 });
    http.expectOne(URL).flush(lista([envio('JDS-1001', { status: 'shipped', tracking_number: 'SERV-10001' }), envio('JDS-1002')]));
    await f.whenStable();
    f.detectChanges();

    const caja = (f.nativeElement as HTMLElement).querySelector('.resultado')!.textContent!;
    expect(caja).toContain('1 enviados');
    expect(caja).toContain('JDS-1002: Primero marca el pedido como pagado.');
    expect(caja).not.toContain('JDS-1001:');
  });

  it('un pedido ya enviado con la misma guía no se vuelve a mandar; con una guía corregida sí', async () => {
    const f = await abrir([envio('JDS-1001', { status: 'shipped', tracking_number: 'SERV-10001' })]);
    const c = f.componentInstance;
    c.todos(true);
    expect(c.listosParaEnviar()).toHaveLength(0);

    c.escribirGuia('JDS-1001', 'SERV-99999');
    expect(c.listosParaEnviar()).toHaveLength(1);
  });

  it('un ciclo sin pedidos pagados lo dice', async () => {
    const f = await abrir([]);
    expect((f.nativeElement as HTMLElement).querySelector('.vacio')?.textContent).toContain('todavía no tiene pedidos pagados');
  });
});
