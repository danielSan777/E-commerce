import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { PedidoPorFacturar } from '../../../dominio/interfaces/facturacion-admin';
import { AdminFacturacion, numeroDeFacturaValido } from './facturacion';

const LISTA = '/api/v1/admin/invoicing';
const LOTE = '/api/v1/admin/invoicing/batch';

const pedido = (numero: string, extra: Partial<PedidoPorFacturar> = {}): PedidoPorFacturar => ({
  number: numero, channel: 'web', payment_method: 'card', paid_at: '2026-11-10T15:00:00Z',
  subtotal_cents: 2100, discount_cents: 0, shipping_cents: 400, card_fee_cents: 0, total_cents: 2500,
  items: [{ name: 'Maceta Fresia', quantity: 1, line_total_cents: 2100 }],
  invoice_to: { name: 'Josué de Santis', id_type: 'cedula', id_number: '0930247994', email: 'j@correo.com', phone: '0991234567', address: 'Av. Principal 123', province: 'Guayas', canton: 'Guayaquil', same_as_shipping: 'yes' },
  invoiced_at: null, invoice_number: null, ...extra,
});

describe('AdminFacturacion', () => {
  let http: HttpTestingController;

  async function abrir(pedidos: PedidoPorFacturar[]) {
    TestBed.configureTestingModule({ imports: [AdminFacturacion], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    http = TestBed.inject(HttpTestingController);
    const f = TestBed.createComponent(AdminFacturacion);
    f.detectChanges();
    http.expectOne(r => r.url === LISTA && r.params.get('state') === 'pending').flush({ data: pedidos, meta: { pending_count: pedidos.length } });
    await f.whenStable();
    f.detectChanges();
    return f;
  }
  afterEach(() => http?.verify());

  it('el número de factura es opcional y acepta letras, números y guiones hasta 30', () => {
    for (const bueno of ['', '  ', '001-001-000000123', 'A'.repeat(30)]) expect(numeroDeFacturaValido(bueno)).toBe(true);
    for (const malo of ['001 001', 'fáctura', 'A'.repeat(31)]) expect(numeroDeFacturaValido(malo)).toBe(false);
  });

  it('muestra los datos de facturación, el total y la cantidad por facturar', async () => {
    const f = await abrir([pedido('JDS-1001')]);
    const t = (f.nativeElement as HTMLElement).textContent!;
    expect(t).toContain('Por facturar (1)');
    expect(t).toContain('JDS-1001');
    expect(t).toContain('Josué de Santis');
    expect(t).toContain('0930247994');
    expect(t).toContain('25.00');
    expect(t).toContain('Maceta Fresia');
  });

  it('marca el lote con el número escrito y null cuando se deja vacío, tras confirmar', async () => {
    const f = await abrir([pedido('JDS-1001'), pedido('JDS-1002')]);
    const c = f.componentInstance;
    c.todos(true);
    c.escribirNumero('JDS-1001', '001-001-123');
    c.pedirConfirmacion();
    expect(c.confirmando()).toBe(true);

    c.marcarFacturados();
    const req = http.expectOne(LOTE);
    expect(req.request.body).toEqual({ orders: [{ number: 'JDS-1001', invoice_number: '001-001-123' }, { number: 'JDS-1002', invoice_number: null }] });
    req.flush({ results: [{ number: 'JDS-1001', ok: true, message: null }, { number: 'JDS-1002', ok: true, message: null }], invoiced: 2 });
    http.expectOne(r => r.url === LISTA).flush({ data: [], meta: { pending_count: 0 } });
    expect(c.pedidos()).toEqual([]);
  });

  it('no deja confirmar sin pedidos marcados ni con un número mal escrito', async () => {
    const f = await abrir([pedido('JDS-1001')]);
    const c = f.componentInstance;
    c.pedirConfirmacion();
    expect(c.confirmando()).toBe(false);

    c.todos(true);
    c.escribirNumero('JDS-1001', 'mala factura!');
    c.pedirConfirmacion();
    expect(c.confirmando()).toBe(false);
  });

  it('en "Facturados" permite volver un pedido a "Por facturar"', async () => {
    const f = await abrir([pedido('JDS-1001')]);
    const c = f.componentInstance;
    c.cambiarEstado('done');
    http.expectOne(r => r.url === LISTA && r.params.get('state') === 'done').flush({ data: [pedido('JDS-1001', { invoiced_at: '2026-11-11T15:00:00Z', invoice_number: '001-001-9' })], meta: { pending_count: 0 } });
    f.detectChanges();
    expect((f.nativeElement as HTMLElement).textContent).toContain('001-001-9');

    c.quitar(c.pedidos()[0]);
    const del = http.expectOne(`${LISTA}/JDS-1001`);
    expect(del.request.method).toBe('DELETE');
    del.flush(pedido('JDS-1001'));
    http.expectOne(r => r.url === LISTA && r.params.get('state') === 'done').flush({ data: [], meta: { pending_count: 1 } });
  });
});
