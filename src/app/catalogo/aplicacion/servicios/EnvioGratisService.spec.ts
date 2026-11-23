import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../core/configuracion/api';
import { CarritoService, ItemCarrito } from '../../../carrito/aplicacion/servicios/CarritoService';
import { EnvioGratisService } from './EnvioGratisService';
import { ModoVentaService, PreciosTienda } from './ModoVentaService';

const maceta = (uid: string, precio: number): ItemCarrito =>
  ({ uid, tipo: 'personalizado', producto: { id: uid, nombre: uid, precio }, vista: '', ruta: '', resumen: [] });

const ESTANDAR: PreciosTienda = { mode: 'standard', free_shipping_min_planters: 2, card_surcharge_percent: 6, discount_percent: 0, free_shipping_everywhere: false };
const TODO_GRATIS: PreciosTienda = { mode: 'free_shipping_discount', free_shipping_min_planters: 2, card_surcharge_percent: 0, discount_percent: 30, free_shipping_everywhere: true };

describe('EnvioGratisService (modo de venta)', () => {
  let envio: EnvioGratisService;
  let carrito: CarritoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    http = TestBed.inject(HttpTestingController);
    envio = TestBed.inject(EnvioGratisService);
    carrito = TestBed.inject(CarritoService);
  });

  it('pide el modo vigente a Laravel una sola vez', () => {
    TestBed.inject(ModoVentaService).cargar();
    const r = http.expectOne('/api/v1/store/pricing');
    r.flush(TODO_GRATIS);

    expect(envio.todoGratis()).toBe(true);
    expect(envio.descuentoPorcentaje()).toBe(30);
    http.expectNone('/api/v1/store/pricing');
  });

  it('modo estándar: envío gratis desde 2 macetas, sin descuento y con recargo', () => {
    http.expectOne('/api/v1/store/pricing').flush(ESTANDAR);
    carrito.items.set([maceta('a', 20)]);
    expect(envio.envioGratis()).toBe(false);
    expect(envio.ofertaSegundaMaceta()).toBe(true);
    expect(envio.descuento()).toBe(0);
    expect(envio.recargoPorcentaje()).toBe(6);
    expect(envio.textoPromo()).toBe('Envío gratis llevando 2 macetas');
    expect(envio.anuncio()).toEqual({ fuerte: 'Envío gratis', resto: 'desde dos unidades' });

    carrito.items.set([maceta('a', 20), maceta('b', 19)]);
    expect(envio.envioGratis()).toBe(true);
    expect(envio.ofertaSegundaMaceta()).toBe(false);
    expect(envio.anuncio()).toEqual({ fuerte: '¡Excelente!', resto: 'Ya tienes envío gratis' });
  });

  it('todas las zonas en $0: envío gratis siempre aunque sea el modo estándar', () => {
    http.expectOne('/api/v1/store/pricing').flush({ ...ESTANDAR, free_shipping_everywhere: true });
    carrito.items.set([maceta('a', 20)]);

    expect(envio.envioGratis()).toBe(true);
    expect(envio.ofertaSegundaMaceta()).toBe(false);
    expect(envio.textoPromo()).toBe('Envío gratis en todos tus pedidos');
    expect(envio.anuncio()).toEqual({ fuerte: 'Envío gratis', resto: 'en todos tus pedidos' });
  });

  it('modo todo gratis: envío gratis siempre, sin recargo y 30 % a la maceta de menor valor desde 2 macetas', () => {
    http.expectOne('/api/v1/store/pricing').flush(TODO_GRATIS);
    carrito.items.set([maceta('a', 20)]);
    expect(envio.envioGratis()).toBe(true);
    expect(envio.descuento()).toBe(0);                     // con una sola maceta no hay descuento
    expect(envio.ofertaSegundaMaceta()).toBe(true);        // se invita a elegir la segunda
    expect(envio.recargoPorcentaje()).toBe(0);
    expect(envio.anuncio().resto).toContain('30% de descuento en tu segunda maceta');

    carrito.items.set([maceta('a', 20), maceta('b', 19)]);
    expect(envio.descuento()).toBe(5.7);                   // 30 % de $19, no de $20
    expect(envio.subtotalConDescuento()).toBeCloseTo(33.3, 2);
    expect(envio.ofertaSegundaMaceta()).toBe(false);

    carrito.items.set([maceta('a', 20), maceta('b', 19), maceta('c', 18)]);
    expect(envio.descuento()).toBe(5.4);                   // un solo descuento: a la de $18
  });

  it('los complementos no cuentan para el descuento', () => {
    http.expectOne('/api/v1/store/pricing').flush(TODO_GRATIS);
    carrito.items.set([maceta('a', 20), { uid: 'c', tipo: 'complemento', producto: { id: 'c', nombre: 'Abono', precio: 3 }, vista: '', ruta: '', resumen: [] }]);

    expect(envio.macetas()).toBe(1);
    expect(envio.descuento()).toBe(0);
  });
});
