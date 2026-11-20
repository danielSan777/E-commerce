import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { CHECKOUT_API, TOKEN_PRUEBA } from '../../../../testing/pedido-api';
import { DatosCheckout } from '../../../aplicacion/servicios/CheckoutService';
import { NuevoPedido, PedidoService } from '../../../aplicacion/servicios/PedidoService';
import { PagoTarjeta } from './pago-tarjeta';

const nuevo = (metodo: 'transferencia' | 'payphone'): NuevoPedido => ({
  metodo, items: [], datos: { metodoPago: metodo, provincia: 'Guayas', canton: 'Durán' } as DatosCheckout,
  subtotal: 25, envio: 3.5, envioGratis: false, recargo: 1.71, total: 30.21,
  entrega: { tipo: 'inmediata', window: { start: '2026-11-12', end: '2026-11-13' }, label: 'x', promise_token: 't' },
});

const INTENTO = (simulated: boolean) => ({ client_transaction_id: 'JDS-48213-1', expires_at: new Date(Date.now() + 600_000).toISOString(), simulated, box: null });

async function montar(metodo: 'transferencia' | 'payphone' = 'payphone') {
  sessionStorage.clear();
  TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
  const http = TestBed.inject(HttpTestingController);
  TestBed.inject(PedidoService).crear(nuevo(metodo)).subscribe();
  http.expectOne('/api/v1/checkout').flush(CHECKOUT_API, { status: 201, statusText: 'Created' });
  const router = TestBed.inject(Router);
  vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  vi.spyOn(router, 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(PagoTarjeta);
  await fixture.whenStable();
  return { fixture, http, router, html: fixture.nativeElement as HTMLElement };
}

describe('PagoTarjeta', () => {
  it('pide a Laravel el intento del pedido y, en modo de pruebas, ofrece simular el resultado', async () => {
    const { fixture, http, router, html } = await montar();
    http.expectOne(`/api/v1/orders/${TOKEN_PRUEBA}/payphone`).flush(INTENTO(true));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(html.textContent).toContain('Modo de prueba');
    expect(html.textContent).toContain('JDS-48213');
    expect(html.querySelector('#pp-button')).toBeNull();

    const [aprobar, rechazar] = Array.from(html.querySelectorAll<HTMLButtonElement>('.pruebas button'));
    aprobar.click();
    const aprobado = (router.navigate as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(aprobado[0]).toEqual(['/checkout/tarjeta/respuesta']);
    expect(aprobado[1].queryParams.clientTransactionId).toBe('JDS-48213-1');
    expect(aprobado[1].queryParams.id).toBeGreaterThan(1);
    rechazar.click();
    expect((router.navigate as ReturnType<typeof vi.fn>).mock.calls[1][1].queryParams.id).toBe(1);
  });

  it('con PayPhone real muestra el contenedor de la Cajita en vez del panel de pruebas', async () => {
    const { fixture, http, html } = await montar();
    http.expectOne(`/api/v1/orders/${TOKEN_PRUEBA}/payphone`).flush({ ...INTENTO(false), box: {
      token: 't', store_id: 's', css_url: 'https://cdn.example/box.css', js_url: 'https://cdn.example/box.js', client_transaction_id: 'JDS-48213-1',
      amount: 3021, amount_without_tax: 3021, currency: 'USD', reference: 'Pedido', identification_type: 1, lang: 'es', time_zone: -5,
    } });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(html.querySelector('#pp-button')).not.toBeNull();
    expect(html.querySelector('.pruebas')).toBeNull();
    expect(document.querySelector('link[href="https://cdn.example/box.css"]')).not.toBeNull();
  });

  it('si Laravel rechaza iniciar el pago (pedido vencido) muestra el motivo y permite reintentar', async () => {
    const { fixture, http, html } = await montar();
    http.expectOne(`/api/v1/orders/${TOKEN_PRUEBA}/payphone`).flush({ code: 'order_closed', message: 'Este pedido venció o fue cancelado.' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(html.querySelector('[role="alert"]')?.textContent).toContain('Este pedido venció');
    html.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    http.expectOne(`/api/v1/orders/${TOKEN_PRUEBA}/payphone`);
  });

  it('un pedido por transferencia no puede estar aquí: vuelve al pago y no pide ningún intento', async () => {
    const { http, router } = await montar('transferencia');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/checkout/pago', { replaceUrl: true });
    http.expectNone(`/api/v1/orders/${TOKEN_PRUEBA}/payphone`);
  });
});
