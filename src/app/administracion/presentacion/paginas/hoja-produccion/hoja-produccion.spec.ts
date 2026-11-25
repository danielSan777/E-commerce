import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { HojaDeProduccion, ItemDeHoja, PedidoDeHoja } from '../../../dominio/interfaces/hojas-admin';
import { AdminHojaProduccion } from './hoja-produccion';

const URL = '/api/v1/admin/cycles/2026-11-09/production';

const maceta = (extra: Partial<ItemDeHoja> = {}): ItemDeHoja => ({
  id: 1, name: 'Maceta Doctor', type: 'personalizable', quantity: 1, plate_text: 'Ñandú Pérez', lens_color: 'cafe', glasses_color: null,
  accessories: ['Estetoscopio', 'Lentes'], frame_text: null, has_frame_photo: false, dedication: 'Para ti, con cariño', ...extra,
});
const pedido = (numero: string, extra: Partial<PedidoDeHoja> = {}): PedidoDeHoja => ({
  number: numero, channel: 'web', payment_method: 'transfer', payment_status: 'paid', status: 'in_production', zone: 'A', extra_days: 0,
  window: { start: '2026-11-12', end: '2026-11-13' }, scheduled: false, planters: 1, items: [maceta()], ...extra,
});
const hoja = (orders: PedidoDeHoja[]): HojaDeProduccion => ({
  cycle: { date: '2026-11-09', dispatch_date: '2026-11-11', window: { start: '2026-11-12', end: '2026-11-13' } },
  orders, totals: { orders: orders.length, planters: orders.reduce((n, p) => n + p.planters, 0) },
});

describe('AdminHojaProduccion', () => {
  let http: HttpTestingController;

  async function abrir(orders: PedidoDeHoja[]) {
    TestBed.configureTestingModule({
      imports: [AdminHojaProduccion],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ fecha: '2026-11-09' }) } } }],
    });
    http = TestBed.inject(HttpTestingController);
    const f = TestBed.createComponent(AdminHojaProduccion);
    f.detectChanges();
    http.expectOne(URL).flush(hoja(orders));
    await f.whenStable();
    f.detectChanges();
    return f;
  }
  afterEach(() => http?.verify());

  it('encabeza la hoja con el ciclo, el despacho, la entrega y el total de pedidos y macetas', async () => {
    const f = await abrir([pedido('JDS-1001'), pedido('JDS-1002', { planters: 3 })]);
    const t = (f.nativeElement as HTMLElement).querySelector('.encabezado')!.textContent!;

    expect(t).toContain('lunes 9 de noviembre de 2026');
    expect(t).toContain('miércoles 11 de noviembre de 2026');
    expect(t).toContain('jueves 12 de noviembre – viernes 13 de noviembre');
    expect(t).toContain('2 de 2 pedidos · 4 macetas');
  });

  it('cada pedido muestra número, canal, pago, zona, entrega y si fue programado; cada maceta, su placa, lentes, accesorios y dedicatoria', async () => {
    const f = await abrir([pedido('JDS-1001', { channel: 'whatsapp', payment_method: 'card', zone: 'B', extra_days: 1, scheduled: true })]);
    const html = f.nativeElement as HTMLElement;
    const cab = html.querySelector('.pedido header')!.textContent!;

    expect(cab).toContain('JDS-1001');
    expect(cab).toContain('WhatsApp');
    expect(cab).toContain('Tarjeta · Pagado');
    expect(cab).toContain('Amazonía (+1 día)');
    expect(cab).toContain('Programado');
    const item = html.querySelector('.item')!.textContent!;
    expect(item).toContain('Maceta Doctor');
    expect(html.querySelector('.placa')?.textContent).toBe('Ñandú Pérez');
    expect(item).toContain('Café');
    expect(item).toContain('Estetoscopio, Lentes');
    expect(item).toContain('Para ti, con cariño');
    expect(html.textContent).not.toContain('$');   // sin precios
  });

  it('un pedido sin programar ni Amazonía no muestra esas marcas; sin dedicatoria lo dice; un complemento se ve como complemento', async () => {
    const f = await abrir([pedido('JDS-1001', { items: [maceta({ dedication: null }), { ...maceta(), id: 2, name: 'Llavero', type: 'complemento', quantity: 2, plate_text: null, accessories: [], lens_color: null, dedication: null }] })]);
    const html = f.nativeElement as HTMLElement;

    expect(html.querySelector('.pedido header')!.textContent).not.toContain('Programado');
    expect(html.querySelector('.pedido header')!.textContent).not.toContain('Amazonía');
    expect(html.querySelectorAll('.item')[0].textContent).toContain('Sin dedicatoria');
    const comp = html.querySelectorAll('.item')[1];
    expect(comp.textContent).toContain('Llavero × 2');
    expect(comp.textContent).toContain('Complemento');
    expect(comp.querySelector('.placa')).toBeNull();
  });

  it('muestra la frase del marco y un botón para descargar la foto del marco', async () => {
    const f = await abrir([pedido('JDS-1001', { items: [maceta({ frame_text: 'Te quiero mucho', has_frame_photo: true })] })]);
    const html = f.nativeElement as HTMLElement;

    expect(html.textContent).toContain('Frase del marco');
    expect(html.textContent).toContain('Te quiero mucho');
    expect(Array.from(html.querySelectorAll('button')).some(b => b.textContent!.includes('Descargar foto'))).toBe(true);
  });

  it('"Copiar texto de placa" copia el texto exacto, con tildes y ñ', async () => {
    const f = await abrir([pedido('JDS-1001')]);
    const copiar = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: copiar }, configurable: true });

    Array.from((f.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')).find(b => b.textContent!.includes('Copiar texto de placa'))!.click();
    await f.whenStable();

    expect(copiar).toHaveBeenCalledWith('Ñandú Pérez');
  });

  it('descargar la foto del marco pide la imagen del ítem con sesión', async () => {
    const f = await abrir([pedido('JDS-1001', { items: [maceta({ has_frame_photo: true })] })]);
    URL_createObjectURL();
    Array.from((f.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')).find(b => b.textContent!.includes('Descargar foto'))!.click();

    const r = http.expectOne('/api/v1/admin/orders/JDS-1001/items/1/frame-photo');
    expect(r.request.responseType).toBe('blob');
    r.flush(new Blob(['x'], { type: 'image/jpeg' }));
  });

  it('quitar un pedido con la casilla lo saca del conteo y de la impresión; "Quitar todos" bloquea imprimir', async () => {
    const f = await abrir([pedido('JDS-1001'), pedido('JDS-1002', { planters: 2 })]);
    const html = f.nativeElement as HTMLElement;
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => undefined);

    html.querySelectorAll<HTMLInputElement>('.incluir input')[1].click();
    f.detectChanges();
    expect(html.querySelector('.resumen')?.textContent).toContain('1 de 2 pedidos · 1 macetas');
    expect(html.querySelectorAll('.pedido')[1].classList).toContain('excluido');   // en pantalla se atenúa; el CSS de impresión lo oculta
    expect(html.querySelectorAll('.pedido')[0].classList).not.toContain('excluido');

    const botonImprimir = Array.from(html.querySelectorAll<HTMLButtonElement>('.herramientas button')).find(b => b.textContent!.includes('Imprimir'))!;
    botonImprimir.click();
    expect(imprimir).toHaveBeenCalledTimes(1);

    Array.from(html.querySelectorAll<HTMLButtonElement>('.herramientas button')).find(b => b.textContent!.includes('Quitar todos'))!.click();
    f.detectChanges();
    expect(botonImprimir.disabled).toBe(true);
    expect(html.querySelector('.resumen')?.textContent).toContain('0 de 2 pedidos');
  });

  it('un ciclo sin pedidos pagados lo dice', async () => {
    const f = await abrir([]);
    expect((f.nativeElement as HTMLElement).querySelector('.vacio')?.textContent).toContain('todavía no tiene pedidos pagados');
  });
});

/** jsdom no trae URL.createObjectURL */
function URL_createObjectURL(): void {
  (globalThis.URL as unknown as { createObjectURL: () => string }).createObjectURL = () => 'blob:x';
  (globalThis.URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = () => undefined;
}
