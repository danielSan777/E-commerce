import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../core/configuracion/api';
import { cotizacionApi } from '../../../testing/cotizacion-api';
import { CarritoService, ItemCarrito } from './CarritoService';
import { CotizacionService } from './CotizacionService';

const maceta = (uid: string, precio = 20): ItemCarrito => ({ uid, tipo: 'personalizado', producto: { id: uid, nombre: uid, precio }, vista: '', ruta: '', resumen: [] });

describe('CotizacionService', () => {
  let servicio: CotizacionService;
  let carrito: CarritoService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    http = TestBed.inject(HttpTestingController);
    servicio = TestBed.inject(CotizacionService);
    carrito = TestBed.inject(CarritoService);
    carrito.items.set([]);
  });

  afterEach(() => localStorage.clear());

  it('con el carrito vacío no pide nada', () => {
    TestBed.tick();
    http.expectNone('/api/v1/cart/quote');
    expect(servicio.cotizacion()).toBeNull();
  });

  it('manda los productos y el cantón, y guarda lo que responde Laravel', () => {
    carrito.items.set([maceta('doctor')]);
    servicio.canton.set('0907');
    TestBed.tick();

    const r = http.expectOne('/api/v1/cart/quote');
    expect(r.request.body).toEqual({ items: [{ slug: 'doctor', quantity: 1 }], canton_code: '0907' });
    expect(servicio.calculando()).toBe(true);
    r.flush(cotizacionApi({ discount_cents: 570 }));

    expect(servicio.calculando()).toBe(false);
    expect(servicio.descuento()).toBe(5.7);
  });

  it('sin cantón manda canton_code nulo', () => {
    carrito.items.set([maceta('doctor')]);
    TestBed.tick();

    expect(http.expectOne('/api/v1/cart/quote').request.body.canton_code).toBeNull();
  });

  it('si el carrito cambia antes de la respuesta, la anterior se descarta', () => {
    carrito.items.set([maceta('a')]);
    TestBed.tick();
    const primera = http.expectOne('/api/v1/cart/quote');
    carrito.items.set([maceta('a'), maceta('b')]);
    TestBed.tick();

    expect(primera.cancelled).toBe(true);
    http.expectOne('/api/v1/cart/quote').flush(cotizacionApi({ subtotal_cents: 3900 }));
    expect(servicio.cotizacion()?.subtotal_cents).toBe(3900);
  });

  it('si Laravel falla, no queda ninguna cifra y se marca el fallo; recargar lo vuelve a intentar', () => {
    carrito.items.set([maceta('a')]);
    TestBed.tick();
    http.expectOne('/api/v1/cart/quote').flush({ message: 'x' }, { status: 500, statusText: 'Error' });

    expect(servicio.cotizacion()).toBeNull();
    expect(servicio.fallo()).toBe(true);

    servicio.recargar();
    http.expectOne('/api/v1/cart/quote').flush(cotizacionApi());
    expect(servicio.fallo()).toBe(false);
  });
});
