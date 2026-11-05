import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pago } from './pago';

describe('Pago', () => {
  let component: Pago;
  let fixture: ComponentFixture<Pago>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pago],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Pago);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('la entrega empieza como "lo antes posible" y los términos desmarcados', () => {
    expect(component.entrega()).toBe('inmediata');
    expect(component.entregaPedido()?.label).toBe('Recíbelo entre jueves 12 y viernes 13 de noviembre');
    expect(component.aceptaTerminos()).toBe(false);
  });

  it('programar elige la primera ventana disponible; una no disponible no se puede elegir', () => {
    component.elegirEntrega('programada');
    expect(component.entregaPedido()?.tipo).toBe('programada');
    expect(component.entregaPedido()?.window).toEqual({ start: '2026-11-12', end: '2026-11-13' });

    component.elegirVentana(component.ventanas[2]);   // no disponible
    expect(component.entregaPedido()?.window).toEqual({ start: '2026-11-12', end: '2026-11-13' });

    component.elegirVentana(component.ventanas[1]);
    expect(component.entregaPedido()?.label).toBe('Del 14 al 16 de noviembre');
  });
});
