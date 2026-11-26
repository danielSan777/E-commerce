import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { PedidoAdmin, estadoDePedido } from '../../../dominio/interfaces/pedidos-admin';
import { AdminPedidos, diaDeEnvio, guiaValida, plazoDeEnvio, ventana } from './pedidos';

const pedido = (over: Partial<PedidoAdmin> = {}): PedidoAdmin => ({
  number: 'JDS-1001', channel: 'web', payment_method: 'transfer', payment_status: 'pending_validation', status: 'created',
  customer: { name: 'María Pérez', email: 'm@correo.com', phone: '0991234567' },
  total_cents: 2450, discount_cents: 0, card_fee_cents: 0, shipping_cents: 350, shipping_zone: 'A', cycle_date: '2026-11-17', dispatch_date: '2026-11-19',
  window: { start: '2026-11-20', end: '2026-11-21', type: 'immediate' }, send_by: '2026-11-19', send_by_at: '2026-11-19T12:00:00Z',
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

  it('cada pedido muestra su fecha de entrega en la lista y en el detalle del cliente', async () => {
    const { c, fixture, el } = await abrir([pedido({ window: { start: '2026-11-27', end: '2026-11-28', type: 'scheduled' } })]);

    expect(el.querySelector('.resumen .entrega')?.textContent).toContain('27 nov');
    c.alternar('JDS-1001');
    fixture.detectChanges();
    expect(el.querySelector('.detalle')?.textContent).toContain('Fecha de entrega');
    expect(el.querySelector('.detalle')?.textContent).toContain('27 nov – 28 nov');
  });

  it('«Avisar retraso» guarda la nueva fecha y el motivo, y el pedido queda marcado como retrasado', async () => {
    const { c, fixture, el } = await abrir([pedido({ payment_status: 'paid', status: 'in_production', window: { start: '2026-11-27', end: '2026-11-28', type: 'scheduled' } })]);
    c.filtro.set('in_production');   // el pedido sigue en esta lista después de guardar
    c.alternar('JDS-1001');
    fixture.detectChanges();
    expect(el.textContent).not.toContain('Retrasado');

    Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find(b => b.textContent?.includes('Avisar retraso'))!.click();
    fixture.detectChanges();
    c.cambiarRetraso('inicio', '2026-12-02');
    c.cambiarRetraso('fin', '2026-12-03');
    c.cambiarRetraso('motivo', 'Se rompió la maceta');
    fixture.detectChanges();
    el.querySelector<HTMLFormElement>('form.retraso')!.dispatchEvent(new Event('submit'));

    const r = http.expectOne('/api/v1/admin/orders/JDS-1001/delay');
    expect(r.request.body).toEqual({ window_start: '2026-12-02', window_end: '2026-12-03', reason: 'Se rompió la maceta' });
    r.flush(pedido({ payment_status: 'paid', status: 'in_production', window: { start: '2026-12-02', end: '2026-12-03', type: 'scheduled' },
      delay: { reason: 'Se rompió la maceta', at: '2026-11-25T15:00:00Z', original_window: { start: '2026-11-27', end: '2026-11-28' } } }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(el.querySelector('form.retraso')).toBeNull();
    expect(el.querySelector('.insignia.retrasado')).not.toBeNull();
    expect(el.querySelector('.detalle')?.textContent).toContain('2 dic – 3 dic');
    expect(el.querySelector('.detalle')?.textContent).toContain('antes: 27 nov – 28 nov');
    expect(el.querySelector('.detalle')?.textContent).toContain('Se rompió la maceta');
  });

  it('si Laravel rechaza las fechas del retraso, el formulario muestra el motivo y no se cierra', async () => {
    const { c, fixture, el } = await abrir([pedido({ payment_status: 'paid', status: 'in_production' })]);
    c.filtro.set('in_production');
    c.alternar('JDS-1001');
    fixture.detectChanges();
    c.abrirRetraso(c.pedidos()[0]);
    fixture.detectChanges();
    c.guardarRetraso(c.pedidos()[0]);

    http.expectOne('/api/v1/admin/orders/JDS-1001/delay').flush({ code: 'validation_failed', message: 'Datos inválidos', errors: { window_start: ['La nueva fecha no puede ser anterior a hoy.'] } }, { status: 422, statusText: 'Unprocessable' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(el.querySelector('form.retraso .campo-error')?.textContent).toContain('anterior a hoy');
  });

  it('el detalle muestra qué personalizó el cliente y adónde se envía', async () => {
    const { c, fixture, el } = await abrir();
    c.alternar('JDS-1001');
    fixture.detectChanges();

    expect(el.textContent).toContain('Ana');
    expect(el.textContent).toContain('Gracias');
    expect(el.textContent).toContain('Av. Principal 123, Durán, Guayas');
  });

  it('el botón «Copiar correo» copia el correo del cliente y avisa', async () => {
    const { c, fixture, el } = await abrir();
    c.alternar('JDS-1001');
    fixture.detectChanges();
    const escribir = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: escribir } });

    const boton = Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find(b => b.textContent?.includes('Copiar correo'))!;
    boton.click();
    await fixture.whenStable();

    expect(escribir).toHaveBeenCalledWith(pedido().customer.email);
  });

  it('el detalle ofrece descargar la etiqueta de envío como PDF o como imagen', async () => {
    const { c, fixture, el } = await abrir();
    c.alternar('JDS-1001');
    fixture.detectChanges();
    const textos = Array.from(el.querySelectorAll('button')).map(b => b.textContent?.trim());

    expect(textos).toContain('Descargar PDF');
    expect(textos).toContain('Descargar imagen');
  });

  it('muestra los accesorios, el color de los lentes, la frase y la foto del marco', async () => {
    const { c, fixture, el } = await abrir();
    c.alternar('JDS-1001');
    fixture.detectChanges();
    const texto = el.textContent!.replace(/\s+/g, ' ');

    expect(texto).toContain('Lentes, Marco con frase, Marco con foto');
    expect(texto).toMatch(/Lentes\s*café/);
    expect(texto).toContain('Mi abogada favorita');
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
    r.flush(pedido({ payment_status: 'paid', status: 'in_production' }));
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

  it('cancelar sin marcar «Notificar» no pide correo; con la casilla envía notify_buyer y el motivo', async () => {
    const { c } = await abrir();
    c.ejecutar(c.pedidos()[0], 'cancelar');
    const sin = http.expectOne('/api/v1/admin/orders/JDS-1001/cancel');
    expect(sin.request.body).toEqual({});
    sin.flush({ message: 'x' }, { status: 409, statusText: 'Conflict' });

    c.notificarCancelacion.set(true);
    c.motivoCancelacion.set('  Sin stock  ');
    c.ejecutar(c.pedidos()[0], 'cancelar');
    const con = http.expectOne('/api/v1/admin/orders/JDS-1001/cancel');
    expect(con.request.body).toEqual({ notify_buyer: true, reason: 'Sin stock' });
    con.flush(pedido({ status: 'cancelled' }));
    expect(c.notificarCancelacion()).toBe(false);
  });

  it('al cancelar un pedido pagado manda el monto del reembolso; el motivo se guarda aunque no se avise por correo', async () => {
    const { c } = await abrir([pedido({ payment_status: 'paid', status: 'in_production' })]);
    c.motivoCancelacion.set('Se rompió');
    c.montoReembolso.set(' 12.50 ');
    c.ejecutar(c.pedidos()[0], 'cancelar');
    const r = http.expectOne('/api/v1/admin/orders/JDS-1001/cancel');
    expect(r.request.body).toEqual({ reason: 'Se rompió', refund_amount: '12.50' });
    r.flush(pedido({ payment_status: 'refunded', status: 'cancelled', refund: { cents: 1250, at: '2026-11-25T18:00:00Z' } }));
    expect(c.montoReembolso()).toBe('');
  });

  it('si Laravel rechaza el monto, se muestra el motivo y la confirmación sigue abierta', async () => {
    const { c, fixture, el } = await abrir([pedido({ payment_status: 'paid', status: 'in_production' })]);
    c.alternar('JDS-1001');
    c.pedirConfirmacion('JDS-1001', 'cancelar');
    c.montoReembolso.set('999');
    c.ejecutar(c.pedidos()[0], 'cancelar');
    http.expectOne('/api/v1/admin/orders/JDS-1001/cancel').flush({ code: 'validation_failed', message: 'Datos inválidos', errors: { refund_amount: ['El reembolso no puede pasar de $24.50.'] } }, { status: 422, statusText: 'Unprocessable' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(el.querySelector('.confirmacion .campo-error')?.textContent).toContain('no puede pasar de $24.50');
  });

  it('un pedido cancelado y pagado ofrece «Registrar reembolso» y lo manda a Laravel', async () => {
    const { c, fixture, el } = await abrir([pedido({ payment_status: 'paid', status: 'cancelled' })]);
    c.filtro.set('cancelled');
    c.alternar('JDS-1001');
    fixture.detectChanges();
    expect(el.textContent).toContain('Registrar reembolso');

    c.montoReembolso.set('24.50');
    c.ejecutar(c.pedidos()[0], 'reembolsar');
    const r = http.expectOne('/api/v1/admin/orders/JDS-1001/refund');
    expect(r.request.body).toEqual({ refund_amount: '24.50' });
    r.flush(pedido({ payment_status: 'refunded', status: 'cancelled', refund: { cents: 2450, at: '2026-11-25T18:00:00Z' } }));
    fixture.detectChanges();

    expect(el.textContent).toContain('Reembolsado');
    expect(el.textContent).not.toContain('Registrar reembolso');
  });

  it('al abrir un pedido pide su historial y lo muestra con el texto, la fecha y el autor', async () => {
    const { c, fixture, el } = await abrir([pedido({ payment_status: 'paid', status: 'in_production' })]);
    c.alternar('JDS-1001');
    http.expectOne('/api/v1/admin/orders/JDS-1001/history').flush({ data: [
      { id: 1, type: 'order', reason: 'created', text: 'Pedido creado (web, transferencia, $24.50)', actor: 'buyer', actor_name: null, at: '2026-11-17T15:00:00Z' },
      { id: 2, type: 'order', reason: 'paid', text: 'Pago confirmado por transferencia; entrega 20 nov – 21 nov', actor: 'admin', actor_name: 'Josué', at: '2026-11-17T20:00:00Z' },
      { id: 3, type: 'email', reason: 'paid', text: 'Correo enviado al comprador: Pago confirmado', actor: 'system', actor_name: null, at: '2026-11-17T20:00:05Z' },
    ] });
    fixture.detectChanges();

    const filas = Array.from(el.querySelectorAll('.historial li')).map(x => x.textContent?.replace(/\s+/g, ' ').trim());
    expect(filas).toHaveLength(3);
    expect(filas[0]).toContain('Pedido creado (web, transferencia, $24.50)');
    expect(filas[0]).toContain('Comprador');
    expect(filas[1]).toContain('Josué');
    expect(filas[2]).toContain('Sistema');
  });

  it('si el historial no carga, se ofrece reintentar; y tras una acción se vuelve a pedir', async () => {
    const { c, fixture, el } = await abrir([pedido({ payment_status: 'paid', status: 'in_production' })]);
    c.filtro.set('all');
    c.alternar('JDS-1001');
    http.expectOne('/api/v1/admin/orders/JDS-1001/history').flush({ message: 'x' }, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(el.querySelector('.historial .campo-error')?.textContent).toContain('No se pudo cargar el historial');

    c.reintentarHistorial('JDS-1001');
    http.expectOne('/api/v1/admin/orders/JDS-1001/history').flush({ data: [] });
    fixture.detectChanges();
    expect(el.querySelector('.historial')?.textContent).toContain('Todavía no hay hechos registrados');

    c.guia.set('AB-12345');
    c.enviar(c.pedidos()[0]);
    http.expectOne('/api/v1/admin/orders/JDS-1001/ship').flush(pedido({ payment_status: 'paid', status: 'shipped', tracking_number: 'AB-12345', shipped_at: '2026-11-18T15:00:00Z' }));
    http.expectOne('/api/v1/admin/orders/JDS-1001/history').flush({ data: [] });   // el envío sumó un hecho: se recarga
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

  it('el buscador pide por código dentro del filtro actual, espera a que termine de escribir y se mantiene al cambiar de lista', async () => {
    const { c, fixture } = await abrir();
    vi.useFakeTimers();   // después de abrir: whenStable no avanza con el reloj simulado
    try {
      const caja = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type=search]')!;
      caja.value = 'jds-10'; caja.dispatchEvent(new Event('input'));
      caja.value = 'jds-1001'; caja.dispatchEvent(new Event('input'));
      http.expectNone(x => x.url === '/api/v1/admin/orders');          // aún está escribiendo

      vi.advanceTimersByTime(300);
      const r = http.expectOne(x => x.url === '/api/v1/admin/orders');
      expect(r.request.params.get('q')).toBe('jds-1001');
      expect(r.request.params.get('status')).toBe('pending');
      r.flush({ data: [] });
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No hay pedidos con ese código en esta lista.');

      c.elegirFiltro('shipped');                                        // otra lista: la búsqueda sigue
      expect(http.expectOne(x => x.url === '/api/v1/admin/orders').request.params.get('q')).toBe('jds-1001');

      c.limpiarBusqueda();
      expect(http.expectOne(x => x.url === '/api/v1/admin/orders').request.params.has('q')).toBe(false);
    } finally { vi.useRealTimers(); }
  });

  it('en cada fila el estado y «Sin comprobante» van uno debajo del otro, junto con el código completo', async () => {
    const { fixture } = await abrir([pedido({ receipt_uploaded_at: null })]);
    const fila = (fixture.nativeElement as HTMLElement).querySelector('.resumen')!;
    const estados = Array.from(fila.querySelectorAll('.estados > .insignia')).map(x => x.textContent?.trim());

    expect(estados).toEqual(['Pendiente de pago', 'Sin comprobante']);
    expect(fila.querySelector('.codigo strong')?.textContent).toBe('JDS-1001');
  });

  it('no existe «Por producir»: el pedido pagado se muestra En producción', async () => {
    const { c, fixture } = await abrir([pedido({ payment_status: 'paid', status: 'in_production' })]);
    expect(c.filtros.map(f => f.valor)).not.toContain('to_produce' as never);
    expect(c.estado(c.pedidos()[0])).toBe('in_production');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Por producir');
  });

  it('en producción muestra el día límite de envío y el temporizador, y ordena por vencimiento o monto', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-17T15:00:00Z'));   // 10:00 en Guayaquil
    try {
      TestBed.configureTestingModule({ imports: [AdminPedidos], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
      http = TestBed.inject(HttpTestingController);
      const fixture = TestBed.createComponent(AdminPedidos);
      fixture.detectChanges();
      http.expectOne(x => x.url === '/api/v1/admin/orders').flush({ data: [] });
      const c = fixture.componentInstance;
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.orden')).toBeNull();                      // el selector solo aparece en En producción

      c.elegirFiltro('in_production');
      const r = http.expectOne(x => x.url === '/api/v1/admin/orders');
      expect(r.request.params.get('sort')).toBe('due');                   // por vencimiento es el default
      r.flush({ data: [pedido({ payment_status: 'paid', status: 'in_production' })] });
      fixture.detectChanges();

      const plazo = el.querySelector('.plazo-envio');
      expect(plazo?.textContent).toContain('Enviar el jueves 19 de nov');
      expect(plazo?.textContent).toContain('Faltan 1 día y 21 horas para enviar');

      c.elegirOrden('amount');
      expect(http.expectOne(x => x.url === '/api/v1/admin/orders').request.params.get('sort')).toBe('amount');
    } finally {
      vi.useRealTimers();
    }
  });

  it('el temporizador cuenta días y horas, y avisa cuando ya venció', () => {
    const limite = '2026-11-19T12:00:00Z';
    const ms = (iso: string) => new Date(iso).getTime();
    expect(plazoDeEnvio(limite, ms('2026-11-17T15:00:00Z'))).toEqual({ texto: 'Faltan 1 día y 21 horas para enviar', nivel: 'ok' });
    expect(plazoDeEnvio(limite, ms('2026-11-18T12:00:00Z'))).toEqual({ texto: 'Falta 1 día para enviar', nivel: 'ok' });
    expect(plazoDeEnvio(limite, ms('2026-11-18T20:00:00Z'))).toEqual({ texto: 'Faltan 16 horas para enviar', nivel: 'pronto' });   // víspera, 15:00 en Ecuador
    expect(plazoDeEnvio(limite, ms('2026-11-19T05:00:00Z'))).toEqual({ texto: 'ENVÍO VENCE HOY · faltan 7 horas', nivel: 'hoy' });   // 00:00 del día de envío
    expect(plazoDeEnvio(limite, ms('2026-11-19T11:30:00Z'))).toEqual({ texto: 'ENVÍO VENCE HOY · falta menos de 1 hora', nivel: 'hoy' });
    expect(plazoDeEnvio(limite, ms('2026-11-19T12:00:00Z')).nivel).toBe('vencido');                                                   // pasadas las 7:00
    expect(plazoDeEnvio(limite, ms('2026-11-20T15:00:00Z'))).toEqual({ texto: 'Plazo vencido hace 1 día y 3 horas', nivel: 'vencido' });
    expect(diaDeEnvio('2026-11-27')).toBe('viernes 27 de nov');
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
        expect(estadoDePedido({ payment_status: 'paid', status: 'in_production' })).toBe('in_production');
    expect(estadoDePedido({ payment_status: 'paid', status: 'shipped' })).toBe('shipped');
    expect(estadoDePedido({ payment_status: 'pending_validation', status: 'expired' })).toBe('expired');
    expect(estadoDePedido({ payment_status: 'paid', status: 'cancelled' })).toBe('cancelled');
    expect(ventana({ start: '2026-11-20', end: '2026-11-21' })).toBe('20 nov – 21 nov');
  });
  it('los filtros de canal, pago y ciclo viajan a Laravel y se pueden quitar', async () => {
    const { c, http: _h } = { ...(await abrir()), http };
    c.elegirCanal('whatsapp');
    let r = http.expectOne(x => x.url === '/api/v1/admin/orders');
    expect(r.request.params.get('channel')).toBe('whatsapp');
    r.flush({ data: [] });

    c.elegirPago('card');
    c.elegirCiclo('2026-11-16');
    const ultimas = http.match(x => x.url === '/api/v1/admin/orders');
    const ultima = ultimas[ultimas.length - 1];
    expect(ultima.request.params.get('channel')).toBe('whatsapp');
    expect(ultima.request.params.get('payment_method')).toBe('card');
    expect(ultima.request.params.get('cycle')).toBe('2026-11-16');
    ultimas.forEach(x => x.flush({ data: [] }));

    c.limpiarFiltrosExtra();
    r = http.expectOne(x => x.url === '/api/v1/admin/orders');
    expect(r.request.params.has('channel') || r.request.params.has('payment_method') || r.request.params.has('cycle')).toBe(false);
    r.flush({ data: [] });
    expect(c.hayFiltrosExtra()).toBe(false);
  });

  it('exportar CSV pide hasta 2000 pedidos con los mismos filtros y descarga el archivo', async () => {
    const descargado: string[] = [];
    const url = vi.spyOn(URL, 'createObjectURL').mockImplementation(b => { descargado.push(String((b as Blob).size)); return 'blob:x'; });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const { c } = await abrir();
    c.elegirCanal('web');
    http.expectOne(x => x.url === '/api/v1/admin/orders').flush({ data: [] });

    c.exportarCsv();
    const r = http.expectOne(x => x.url === '/api/v1/admin/orders');
    expect(r.request.params.get('limit')).toBe('2000');
    expect(r.request.params.get('channel')).toBe('web');
    r.flush({ data: [pedido()] });

    expect(url).toHaveBeenCalled();
    expect(descargado.length).toBe(1);
    expect(c.exportando()).toBe(false);
  });
  it('«Pasar al siguiente ciclo» pide confirmación, llama a Laravel y, si el ciclo está lleno, pide confirmar el sobrecupo', async () => {
    const enProduccion = pedido({ payment_status: 'paid', status: 'in_production' });
    const { c } = await abrir([enProduccion]);
    c.filtro.set('in_production');

    c.pedirConfirmacion('JDS-1001', 'mover_ciclo');
    c.ejecutar(enProduccion, 'mover_ciclo');
    let r = http.expectOne('/api/v1/admin/orders/JDS-1001/move-cycle');
    expect(r.request.body).toEqual({ confirm_over_capacity: false });
    r.flush({ code: 'capacity_over_limit', message: 'El ciclo ya tiene 10 pedidos.' }, { status: 409, statusText: 'Conflict' });
    expect(c.sobrecupo()?.numero).toBe('JDS-1001');

    c.ejecutar(enProduccion, 'mover_ciclo', true);
    r = http.expectOne('/api/v1/admin/orders/JDS-1001/move-cycle');
    expect(r.request.body).toEqual({ confirm_over_capacity: true });
    r.flush({ ...enProduccion, cycle_date: '2026-11-18', window: { start: '2026-11-21', end: '2026-11-22', type: 'immediate' } });
    expect(c.pedidos()[0].cycle_date).toBe('2026-11-18');
    expect(c.confirmando()).toBeNull();
  });

  it('el origen de la venta se muestra en el detalle y los filtros de fuente, campaña y anuncio viajan a Laravel', async () => {
    const p = pedido({ attribution: { source: 'meta', medium: 'paid', campaign: 'dia-madre', ad_id: 'AD-777', landing_url: null } });
    const { c, fixture, el } = await abrir([p]);
    c.alternar('JDS-1001');
    fixture.detectChanges();
    expect(el.querySelector('.detalle')?.textContent).toContain('dia-madre');
    expect(el.querySelector('.detalle')?.textContent).toContain('AD-777');

    vi.useFakeTimers();
    try { c.escribirOrigen('campana', 'dia-madre'); c.escribirOrigen('anuncio', 'AD-777'); vi.advanceTimersByTime(400); } finally { vi.useRealTimers(); }
    const r = http.expectOne(x => x.url === '/api/v1/admin/orders');
    expect(r.request.params.get('campaign')).toBe('dia-madre');
    expect(r.request.params.get('ad')).toBe('AD-777');
    r.flush({ data: [] });
    expect(c.hayFiltrosExtra()).toBe(true);
  });

});
