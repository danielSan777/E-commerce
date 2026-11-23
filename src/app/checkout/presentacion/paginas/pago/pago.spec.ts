import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_URL } from '../../../../core/configuracion/api';
import { PROMESA_API, VENTANAS_API } from '../../../../testing/entrega-api';
import { CheckoutService } from '../../../aplicacion/servicios/CheckoutService';
import { UbicacionesService } from '../../../aplicacion/servicios/UbicacionesService';
import { PromesaService } from '../../../aplicacion/servicios/PromesaService';
import { CarritoService } from '../../../../carrito/aplicacion/servicios/CarritoService';
import { CHECKOUT_API } from '../../../../testing/pedido-api';
import { PedidoService } from '../../../aplicacion/servicios/PedidoService';
import { ModoVentaService } from '../../../../catalogo/aplicacion/servicios/ModoVentaService';
import { Pago } from './pago';

describe('Pago', () => {
  let component: Pago;
  let fixture: ComponentFixture<Pago>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pago],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Pago);
    component = fixture.componentInstance;
    await fixture.whenStable();
    // La promesa y las ventanas las calcula Laravel: se piden al abrir el pago
    http.match(r => r.url === '/api/v1/locations').forEach(r => r.flush({ zones: [], provinces: [] }));
    http.match(r => r.url === '/api/v1/delivery/promise').forEach(r => r.flush(PROMESA_API));
    http.match(r => r.url === '/api/v1/delivery/windows').forEach(r => r.flush({ windows: VENTANAS_API }));
    await fixture.whenStable();
  });

  // Lo guardado en el navegador (datos del checkout, pedido) no debe pasar de una prueba a la siguiente
  afterEach(() => { localStorage.clear(); sessionStorage.clear(); });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('PayPhone aparece primero y transferencia bancaria después', () => {
    TestBed.inject(CarritoService).items.set([{ uid: 'a', tipo: 'personalizado', producto: { id: 'a', nombre: 'a', precio: 20 }, vista: '', ruta: '', resumen: [] }]);
    fixture.detectChanges();
    const nombres = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.metodo .metodo-texto > strong')).map(e => e.textContent?.trim());

    expect(nombres).toEqual(['Tarjeta con PayPhone', 'Transferencia bancaria']);
  });

  describe('modo de venta', () => {
    const maceta = (uid: string, precio: number) => ({ uid, tipo: 'personalizado' as const, producto: { id: uid, nombre: uid, precio }, vista: '', ruta: '', resumen: [] });

    it('modo estándar: recargo de PayPhone sobre productos + envío', () => {
      TestBed.inject(CarritoService).items.set([maceta('a', 20), maceta('b', 19)]);   // 2 macetas: envío gratis

      expect(component.descuento()).toBe(0);
      expect(component.totalTransferencia()).toBe(39);
      expect(component.recargoPayphone()).toBe(2.34);
      expect(component.totalPayphone()).toBe(41.34);
    });

    it('modo todo gratis: 30 % a las macetas menos la más cara, envío gratis y sin recargo (el total es el final con cualquier método)', () => {
      TestBed.inject(ModoVentaService).precios.set({ mode: 'free_shipping_discount', free_shipping_min_planters: 2, card_surcharge_percent: 0, discount_percent: 30, free_shipping_everywhere: true });
      TestBed.inject(CarritoService).items.set([maceta('a', 20), maceta('b', 19)]);
      fixture.detectChanges();
      const html = fixture.nativeElement as HTMLElement;

      expect(component.descuento()).toBe(5.7);
      expect(component.envio()).toBe(0);
      expect(component.totalTransferencia()).toBe(33.3);
      expect(component.recargoPayphone()).toBe(0);
      expect(component.totalPayphone()).toBe(33.3);
      expect(html.textContent).toContain('Descuento 30% (todas menos la de mayor valor)');
      expect(html.textContent).toContain('¡Gratis!');
      expect(html.querySelector('.incluye')).toBeNull();   // no hay "Incluye +6%"
    });

    it('una zona con tarifa $0 se muestra como «¡Gratis!»', () => {
      TestBed.inject(CarritoService).items.set([maceta('a', 20)]);
      TestBed.inject(CheckoutService).actualizar({ provincia: 'Guayas', canton: 'Durán' });
      TestBed.inject(UbicacionesService).recargar();
      http.match(r => r.url === '/api/v1/locations').forEach(r => r.flush({
        zones: [{ code: 'A', name: 'Zona A', price_cents: 0, extra_days: 0, is_available: true }],
        provinces: [{ code: '09', name: 'Guayas', cantons: [{ code: '0907', name: 'Durán', zone: 'A', is_locality: false }] }],
      }));
      fixture.detectChanges();

      expect(component.envio()).toBe(0);
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('¡Gratis!');
    });
  });

  it('la entrega empieza como "lo antes posible" con la promesa de Laravel y los términos desmarcados', () => {
    expect(component.entrega()).toBe('inmediata');
    expect(component.entregaPedido()?.label).toBe('Recíbelo entre jueves 12 y viernes 13 de noviembre');
    expect(component.entregaPedido()?.promise_token).toBe('firmado-por-laravel');
    expect(component.aceptaTerminos()).toBe(false);
  });

  it('programar elige la primera ventana disponible; una no disponible no se puede elegir', () => {
    component.elegirEntrega('programada');
    expect(component.entregaPedido()?.tipo).toBe('programada');
    expect(component.entregaPedido()?.window).toEqual({ start: '2026-11-12', end: '2026-11-13' });

    component.elegirVentana(component.ventanas()[2]);   // no disponible
    expect(component.entregaPedido()?.window).toEqual({ start: '2026-11-12', end: '2026-11-13' });

    component.elegirVentana(component.ventanas()[1]);
    expect(component.entregaPedido()?.label).toBe('Del 14 al 16 de noviembre');
  });

  it('una ventana guardada en el pasado se descarta y vuelve a "lo antes posible"', async () => {
    TestBed.inject(CheckoutService).actualizar({ entrega: 'programada', ventanaInicio: '2026-11-02', ventanaFin: '2026-11-03' });
    await fixture.whenStable();

    expect(TestBed.inject(PromesaService).esVigente('2026-11-02', '2026-11-03')).toBe(false);
    expect(component.entrega()).toBe('inmediata');
    expect(component.entregaPedido()?.tipo).toBe('inmediata');
  });

  describe('confirmar pedido por transferencia', () => {
    const UBICACIONES = {
      zones: [{ code: 'A', name: 'Zona A', price_cents: 350, extra_days: 0, is_available: true }],
      provinces: [{ code: '09', name: 'Guayas', cantons: [{ code: '0907', name: 'Durán', zone: 'A', is_locality: false }] }],
    };

    async function prepararConfirmacion() {
      TestBed.inject(CarritoService).items.set([{
        uid: 'u1', tipo: 'complemento', producto: { id: 'abono', nombre: 'Abono', precio: 5 }, vista: '', ruta: '', resumen: [],
      }]);
      TestBed.inject(CheckoutService).actualizar({ provincia: 'Guayas', canton: 'Durán', metodoPago: 'transferencia' });
      // Las ubicaciones ya se pidieron en beforeEach: se recargan con datos reales de prueba
      TestBed.inject(UbicacionesService).recargar();
      http.match(r => r.url === '/api/v1/locations').forEach(r => r.flush(UBICACIONES));
      await fixture.whenStable();
      http.match(r => r.url.startsWith('/api/v1/delivery')).forEach(r => r.flush(r.request.url.endsWith('promise') ? PROMESA_API : { windows: VENTANAS_API }));
      await fixture.whenStable();
      component.aceptaTerminos.set(true);
    }

    it('manda el pedido a Laravel y, si sale bien, queda guardado para la confirmación', async () => {
      await prepararConfirmacion();
      const ir = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      component.confirmar();

      const r = http.expectOne('/api/v1/checkout');
      expect(r.request.body.shipping).toMatchObject({ province_code: '09', canton_code: '0907' });
      expect(r.request.body.promise_token).toBe('firmado-por-laravel');
      r.flush(CHECKOUT_API, { status: 201, statusText: 'Created' });

      expect(TestBed.inject(PedidoService).pedido()?.numero).toBe('JDS-48213');
      expect(ir).toHaveBeenCalledWith('/checkout/confirmacion');
    });

    it('si el total cambió, muestra el aviso con el total nuevo y no deja el pedido guardado', async () => {
      await prepararConfirmacion();
      component.confirmar();

      http.expectOne('/api/v1/checkout').flush(
        { code: 'price_changed', message: 'Actualizamos el total de tu pedido.', details: { total_cents: 1000 } },
        { status: 409, statusText: 'Conflict' });

      expect(component.errorPedido()).toContain('El total ahora es $10.00');
      expect(component.enviando()).toBe(false);
      expect(TestBed.inject(PedidoService).pedido()).toBeNull();
    });

    it('si la fecha cambió, vuelve a "lo antes posible" y pide de nuevo la promesa', async () => {
      await prepararConfirmacion();
      TestBed.inject(CheckoutService).actualizar({ entrega: 'programada', ventanaInicio: '2026-11-12', ventanaFin: '2026-11-13' });
      component.confirmar();

      http.expectOne('/api/v1/checkout').flush(
        { code: 'window_changed', message: 'Actualizamos tu fecha estimada.', details: { label: 'Recíbelo el viernes 13' } },
        { status: 409, statusText: 'Conflict' });

      expect(component.entrega()).toBe('inmediata');
      expect(component.errorPedido()).toContain('Recíbelo el viernes 13');
      expect(http.match(r => r.url === '/api/v1/delivery/promise').length).toBe(1);
    });

    it('un error de una maceta (por ejemplo, falta la foto del marco) se explica con su nombre', async () => {
      await prepararConfirmacion();
      TestBed.inject(CarritoService).items.set([{
        uid: 'u1', tipo: 'personalizado', producto: { id: 'doctora', nombre: 'Doctora', precio: 25 }, vista: '', ruta: '', resumen: [],
        configuracion: { accesorios: [], nombre: 'Ana', colorLentes: 'negro', colorGafas: 'negro', dedicatoria: '', textoMarco: '', sinTarjeta: true, fotoMarcoNombre: '' },
      }]);
      component.confirmar();

      http.expectOne('/api/v1/checkout').flush(
        { code: 'validation_error', message: 'Datos inválidos.', errors: { 'items.0.personalization.frame_photo': ['Sube la foto del marco.'] } },
        { status: 422, statusText: 'Unprocessable' });

      expect(component.errorPedido()).toBe('Revisa tu maceta «Doctora»: Sube la foto del marco. Edítala desde el carrito.');
    });

    it('no envía dos veces mientras Laravel responde', async () => {
      await prepararConfirmacion();
      component.confirmar();
      component.confirmar();

      expect(http.match('/api/v1/checkout').length).toBe(1);
    });
  });
});
