import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { CarritoService } from '../../../../carrito/aplicacion/servicios/CarritoService';
import { API_URL } from '../../../../core/configuracion/api';
import { CHECKOUT_API, TOKEN_PRUEBA } from '../../../../testing/pedido-api';
import { DatosCheckout } from '../../../aplicacion/servicios/CheckoutService';
import { NuevoPedido, PedidoService } from '../../../aplicacion/servicios/PedidoService';
import { RespuestaPayphone } from './respuesta-payphone';

const nuevo = (): NuevoPedido => ({
  metodo: 'payphone', items: [], datos: { metodoPago: 'payphone', provincia: 'Guayas', canton: 'Durán' } as DatosCheckout,
  subtotal: 25, envio: 3.5, envioGratis: false, recargo: 1.71, total: 30.21,
  entrega: { tipo: 'inmediata', window: { start: '2026-11-12', end: '2026-11-13' }, label: 'x', promise_token: 't' },
});

const RESPUESTA = (result: string, extra: object = {}) => ({ result, message: `msg ${result}`, simulated: false, order_number: 'JDS-48213', token: null, event_id: null, ...extra });

async function montar(query: Record<string, string>, conPedidoEnLaSesion = true) {
  sessionStorage.clear();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' },
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: (k: string) => query[k] ?? null } } } }],
  });
  const http = TestBed.inject(HttpTestingController);
  if (conPedidoEnLaSesion) {
    TestBed.inject(PedidoService).crear(nuevo()).subscribe();
    http.expectOne('/api/v1/checkout').flush(CHECKOUT_API, { status: 201, statusText: 'Created' });
  }
  const router = TestBed.inject(Router);
  vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  const vaciar = vi.spyOn(TestBed.inject(CarritoService), 'vaciar');
  const fixture = TestBed.createComponent(RespuestaPayphone);
  await fixture.whenStable();
  return { fixture, http, router, vaciar, html: fixture.nativeElement as HTMLElement };
}

const Q = { id: '555', clientTransactionId: 'JDS-48213-1' };

describe('RespuestaPayphone', () => {
  it('manda a Laravel solo lo que trae la URL; aprobado: pedido pagado, carrito vacío y a la confirmación', async () => {
    const { http, router, vaciar } = await montar(Q);
    const r = http.expectOne('/api/v1/payments/payphone/confirm');
    expect(r.request.body).toEqual({ id: 555, client_transaction_id: 'JDS-48213-1' });
    r.flush(RESPUESTA('approved', { token: TOKEN_PRUEBA, simulated: true }));
    await Promise.resolve();

    expect(TestBed.inject(PedidoService).pedido()!.pagoConfirmado).toBe(true);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/checkout/confirmacion', { replaceUrl: true });
    expect(vaciar).toHaveBeenCalled();
  });

  it('aprobado desde otro navegador (sin pedido en la sesión): lleva al seguimiento por su enlace privado', async () => {
    const { http, router, vaciar } = await montar(Q, false);
    http.expectOne('/api/v1/payments/payphone/confirm').flush(RESPUESTA('approved', { token: TOKEN_PRUEBA }));

    expect(router.navigateByUrl).toHaveBeenCalledWith(`/pedido/${TOKEN_PRUEBA}`, { replaceUrl: true });
    expect(vaciar).not.toHaveBeenCalled();
  });

  it('rechazado o cancelado: pantalla amable, el pedido sigue sin pagar y puede reintentar', async () => {
    const { fixture, http, html, vaciar } = await montar(Q);
    http.expectOne('/api/v1/payments/payphone/confirm').flush(RESPUESTA('declined', { message: 'No te cobramos nada.' }));
    fixture.detectChanges();

    expect(html.textContent).toContain('No se completó el pago');
    expect(html.textContent).toContain('No te cobramos nada.');
    expect(html.querySelector('a[href="/checkout/tarjeta"]')?.textContent).toContain('Intentar de nuevo');
    expect(TestBed.inject(PedidoService).pedido()!.pagoConfirmado).toBe(false);
    expect(vaciar).not.toHaveBeenCalled();
  });

  it('pago en revisión (monto distinto o duplicado): pide no pagar otra vez', async () => {
    const { fixture, http, html } = await montar(Q);
    http.expectOne('/api/v1/payments/payphone/confirm').flush(RESPUESTA('review', { message: 'No pagues otra vez.' }));
    fixture.detectChanges();

    expect(html.textContent).toContain('Estamos revisando tu pago');
    expect(html.textContent).toContain('No pagues otra vez.');
    expect(TestBed.inject(PedidoService).pedido()!.pagoConfirmado).toBe(false);
  });

  it('error al confirmar: permite volver a pedir la confirmación', async () => {
    const { fixture, http, html } = await montar(Q);
    http.expectOne('/api/v1/payments/payphone/confirm').flush(RESPUESTA('error', { message: 'Inténtalo de nuevo.' }));
    fixture.detectChanges();

    expect(html.textContent).toContain('No pudimos confirmar tu pago todavía');
    html.querySelector<HTMLButtonElement>('button')!.click();
    http.expectOne('/api/v1/payments/payphone/confirm').flush(RESPUESTA('approved', { token: TOKEN_PRUEBA }));
    expect(TestBed.inject(PedidoService).pedido()!.pagoConfirmado).toBe(true);
  });

  it('sin id o sin referencia en la URL no llama a Laravel', async () => {
    const { fixture, http, html } = await montar({ id: 'abc' });
    http.expectNone('/api/v1/payments/payphone/confirm');
    fixture.detectChanges();
    expect(html.textContent).toContain('No encontramos tu pago');
  });
});
