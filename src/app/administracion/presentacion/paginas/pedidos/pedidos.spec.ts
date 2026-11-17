import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { PedidoAdmin, estadoDePedido } from '../../../dominio/interfaces/pedidos-admin';
import { AdminPedidos, guiaValida, ventana } from './pedidos';

const pedido = (over: Partial<PedidoAdmin> = {}): PedidoAdmin => ({
  number: 'JDS-1001', channel: 'web', payment_method: 'transfer', payment_status: 'pending_validation', status: 'created',
  customer: { name: 'María Pérez', email: 'm@correo.com', phone: '0991234567' },
  total_cents: 2450, shipping_cents: 350, shipping_zone: 'A', cycle_date: '2026-11-17', dispatch_date: '2026-11-19',
  window: { start: '2026-11-20', end: '2026-11-21', type: 'immediate' },
  deadline_at: '2026-11-18T03:00:00Z', receipt_uploaded_at: '2026-11-17T20:00:00Z', whatsapp_clicked_at: null, paid_at: null, production_started_at: null, shipped_at: null, tracking_number: null, created_at: '2026-11-17T15:00:00Z',
  items: [{
    id: 55, has_preview: true, has_frame_photo: true, sku: 'DOC', name: 'Abogada', type: 'personalizable', line_total_cents: 2100,
    personalization: {
      name_text: 'Ana', dedication: { mode: 'text', text: 'Gracias' },
      accessories: [{ id: 1, name: 'Lentes', behavior: 'lentes' }, { id: 2, name: 'Marco con frase', behavior: 'marco_frase' }, { id: 3, name: 'Marco con foto', behavior: 'marco_foto' }],
      lens_color: 'cafe', glasses_color: null, frame_text: 'Mi abogada favorita', has_frame_photo: true,
    },
  }],
  shipping: { name: 'María Pérez', id_number: '0954091989', phone: '0991234567', email: 'm@correo.com', address: 'Av. Principal 123', reference: '', province_name: 'Guayas', canton_name: 'Durán' },
  billing: { same_as_shipping: true },
  ...over,
});

describe('AdminPedidos', () => {
  let http: HttpTestingController;

  async function abrir(lista: PedidoAdmin[] = [pedido()]) {
    TestBed.configureTestingModule({ imports: [AdminPedidos], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminPedidos);
    fixture.detectChanges();
    const r = http.expectOne(x => x.url === '/api/v1/admin/orders');
    expect(r.request.params.get('status')).toBe('pending');
    r.flush({ data: lista });
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, c: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
  }

  it('lista los pedidos por validar con su estado y si traen comprobante', async () => {
    const { el } = await abrir();

    expect(el.textContent).toContain('JDS-1001');
    expect(el.textContent).toContain('María Pérez');
    expect(el.textContent).toContain('$24.50');
    expect(el.textContent).toContain('Con comprobante');
  });

  it('el detalle muestra qué personalizó el cliente y adónde se envía', async () => {
    const { c, fixture, el } = await abrir();
    c.alternar('JDS-1001');
    fixture.detectChanges();

    expect(el.textContent).toContain('«Ana»');
    expect(el.textContent).toContain('«Gracias»');
    expect(el.textContent).toContain('Av. Principal 123, Durán, Guayas');
  });

  it('muestra los accesorios, el color de los lentes, la frase y la foto del marco', async () => {
    const { c, fixture, el } = await abrir();
    c.alternar('JDS-1001');
    fixture.detectChanges();
    const texto = el.textContent!.replace(/\s+/g, ' ');

    expect(texto).toContain('Lentes, Marco con frase, Marco con foto');
    expect(texto).toMatch(/Lentes\s*café/);
    expect(texto).toContain('«Mi abogada favorita»');
    expect(texto).toContain('Subida por el comprador');
    expect(texto).toContain('Ver foto de la maceta');
    expect(texto).toContain('Ver foto del marco');
  });

  it('ver foto del marco la descarga con la sesión del administrador y la abre', async () => {
    const { c } = await abrir();
    const abrirVentana = vi.spyOn(window, 'open').mockReturnValue(null);
    URL.createObjectURL = vi.fn(() => 'blob:marco');
    c.verImagen(c.pedidos()[0], 55, 'frame-photo');
    const r = http.expectOne('/api/v1/admin/orders/JDS-1001/items/55/frame-photo');
    expect(r.request.responseType).toBe('blob');
    r.flush(new Blob(['x'], { type: 'image/jpeg' }));

    expect(abrirVentana).toHaveBeenCalledWith('blob:marco', '_blank', 'noopener');
  });

  it('marcar pagado pide confirmación y luego llama a Laravel; el pedido sale de "Por validar"', async () => {
    const { c, fixture } = await abrir();
    const avisos = TestBed.inject(AvisosService);
    const exito = vi.spyOn(avisos, 'exito');
    c.alternar('JDS-1001');
    c.pedirConfirmacion('JDS-1001', 'pagar');
    http.expectNone('/api/v1/admin/orders/JDS-1001/mark-paid');

    c.ejecutar(c.pedidos()[0], 'pagar');
    const r = http.expectOne('/api/v1/admin/orders/JDS-1001/mark-paid');
    expect(r.request.body).toEqual({ late: false, confirm_over_capacity: false });
    r.flush(pedido({ payment_status: 'paid', status: 'ready_for_production' }));
    fixture.detectChanges();

    expect(c.pedidos()).toEqual([]);
    expect(exito).toHaveBeenCalled();
  });

  it('"pagado fuera de plazo" manda late=true', async () => {
    const { c } = await abrir([pedido({ status: 'expired' })]);
    c.ejecutar(c.pedidos()[0], 'pagar_tarde');

    expect(http.expectOne('/api/v1/admin/orders/JDS-1001/mark-paid').request.body.late).toBe(true);
  });

  it('si el ciclo pasa del límite, pide confirmar y reenvía con confirm_over_capacity', async () => {
    const { c } = await abrir();
    c.pedirConfirmacion('JDS-1001', 'pagar');
    c.ejecutar(c.pedidos()[0], 'pagar');
    http.expectOne('/api/v1/admin/orders/JDS-1001/mark-paid').flush(
      { code: 'capacity_over_limit', message: 'El ciclo ya tiene 10 pedidos (límite 10). Confirma para superarlo.' },
      { status: 409, statusText: 'Conflict' });

    expect(c.sobrecupo()?.mensaje).toContain('límite 10');
    expect(c.confirmando()).not.toBeNull();

    c.ejecutar(c.pedidos()[0], 'pagar', true);
    expect(http.expectOne('/api/v1/admin/orders/JDS-1001/mark-paid').request.body.confirm_over_capacity).toBe(true);
  });

  it('cancelar llama al endpoint de cancelación', async () => {
    const { c } = await abrir();
    c.ejecutar(c.pedidos()[0], 'cancelar');
    const r = http.expectOne('/api/v1/admin/orders/JDS-1001/cancel');
    r.flush(pedido({ status: 'cancelled' }));

    expect(c.pedidos()).toEqual([]);
  });

  it('ver comprobante descarga el archivo con la sesión del administrador y lo abre', async () => {
    const { c } = await abrir();
    const abrirVentana = vi.spyOn(window, 'open').mockReturnValue(null);
    URL.createObjectURL = vi.fn(() => 'blob:prueba');
    c.verComprobante(c.pedidos()[0]);
    const r = http.expectOne('/api/v1/admin/orders/JDS-1001/receipt');
    expect(r.request.responseType).toBe('blob');
    r.flush(new Blob(['x'], { type: 'application/pdf' }));

    expect(abrirVentana).toHaveBeenCalledWith('blob:prueba', '_blank', 'noopener');
  });

  it('cambiar de filtro vuelve a pedir la lista', async () => {
    const { c } = await abrir();
    c.elegirFiltro('shipped');

    expect(http.expectOne(x => x.url === '/api/v1/admin/orders').request.params.get('status')).toBe('shipped');
  });

  it('pasar a producción pide confirmación y llama a Laravel; el pedido sale de "Por producir"', async () => {
    const { c } = await abrir([pedido({ payment_status: 'paid', status: 'ready_for_production' })]);
    c.filtro.set('to_produce');
    c.ejecutar(c.pedidos()[0], 'produccion');
    http.expectOne('/api/v1/admin/orders/JDS-1001/production').flush(pedido({ payment_status: 'paid', status: 'in_production' }));

    expect(c.pedidos()).toEqual([]);
  });

  it('marcar enviado exige una guía válida y la manda a Laravel', async () => {
    const { c } = await abrir([pedido({ payment_status: 'paid', status: 'in_production' })]);
    c.filtro.set('in_production');
    c.guia.set('ab !');
    c.enviar(c.pedidos()[0]);
    http.expectNone('/api/v1/admin/orders/JDS-1001/ship');
    expect(c.errorGuia()).toContain('guía de Servientrega');

    c.guia.set(' 1234567890 ');
    c.enviar(c.pedidos()[0]);
    const r = http.expectOne('/api/v1/admin/orders/JDS-1001/ship');
    expect(r.request.body).toEqual({ tracking_number: '1234567890' });
    r.flush(pedido({ payment_status: 'paid', status: 'shipped', tracking_number: '1234567890' }));

    expect(c.pedidos()).toEqual([]);   // ya no está "En producción"
    expect(c.errorGuia()).toBe('');
  });

  it('un pedido enviado muestra su guía y permite corregirla', async () => {
    const { c, fixture, el } = await abrir([pedido({ payment_status: 'paid', status: 'shipped', shipped_at: '2026-11-18T15:00:00Z', tracking_number: '1234567890' })]);
    c.alternar('JDS-1001');
    fixture.detectChanges();

    expect(el.textContent).toContain('guía 1234567890');
    expect(el.textContent).toContain('Guardar guía');
    expect(el.querySelector<HTMLInputElement>('.fila-guia input')?.value).toBe('1234567890');
  });

  it('el campo de la guía solo aparece cuando el pedido ya está en producción', async () => {
    const { c, fixture, el } = await abrir([pedido({ payment_status: 'paid', status: 'ready_for_production' })]);
    c.alternar('JDS-1001');
    fixture.detectChanges();

    expect(el.textContent).toContain('Pasar a producción');
    expect(el.querySelector('.envio-guia')).toBeNull();
  });

  it('en producción sí muestra la guía y ya no ofrece "Pasar a producción"', async () => {
    const { c, fixture, el } = await abrir([pedido({ payment_status: 'paid', status: 'in_production' })]);
    c.alternar('JDS-1001');
    fixture.detectChanges();

    expect(el.querySelector('.envio-guia')).not.toBeNull();
    expect(el.textContent).not.toContain('Pasar a producción');
  });

  it('la guía se valida como en Laravel', () => {
    expect(guiaValida('1234567890')).toBe(true);
    expect(guiaValida(' AB-12345 ')).toBe(true);
    expect(guiaValida('1234')).toBe(false);
    expect(guiaValida('12 34 56')).toBe(false);
  });

  it('estado y ventana en texto', () => {
    expect(estadoDePedido({ payment_status: 'paid', status: 'ready_for_production' })).toBe('to_produce');
    expect(estadoDePedido({ payment_status: 'paid', status: 'in_production' })).toBe('in_production');
    expect(estadoDePedido({ payment_status: 'paid', status: 'shipped' })).toBe('shipped');
    expect(estadoDePedido({ payment_status: 'pending_validation', status: 'expired' })).toBe('expired');
    expect(estadoDePedido({ payment_status: 'paid', status: 'cancelled' })).toBe('cancelled');
    expect(ventana({ start: '2026-11-20', end: '2026-11-21' })).toBe('20 nov – 21 nov');
  });
});
