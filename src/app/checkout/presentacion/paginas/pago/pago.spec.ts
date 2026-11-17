import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_URL } from '../../../../core/configuracion/api';
import { PROMESA_API, VENTANAS_API } from '../../../../testing/entrega-api';
import { CheckoutService } from '../../../aplicacion/servicios/CheckoutService';
import { PromesaService } from '../../../aplicacion/servicios/PromesaService';
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

  it('should create', () => {
    expect(component).toBeTruthy();
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
});
