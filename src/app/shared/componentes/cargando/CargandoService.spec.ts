import { TestBed } from '@angular/core/testing';
import { CargandoService } from './CargandoService';

describe('CargandoService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('no aparece si la API responde rápido (menos de 200 ms)', () => {
    const s = TestBed.inject(CargandoService);
    s.iniciar();
    vi.advanceTimersByTime(150);
    s.terminar();
    vi.advanceTimersByTime(1000);
    expect(s.visible()).toBe(false);
  });

  it('aparece tras 200 ms y se queda al menos 600 ms aunque la respuesta llegue enseguida', () => {
    const s = TestBed.inject(CargandoService);
    s.iniciar();
    vi.advanceTimersByTime(200);
    expect(s.visible()).toBe(true);
    s.terminar();
    vi.advanceTimersByTime(300);
    expect(s.visible()).toBe(true);
    vi.advanceTimersByTime(400);
    expect(s.visible()).toBe(false);
  });

  it('con varias consultas a la vez, espera a que termine la última', () => {
    const s = TestBed.inject(CargandoService);
    s.iniciar(); s.iniciar();
    vi.advanceTimersByTime(200);
    s.terminar();
    vi.advanceTimersByTime(5000);
    expect(s.visible()).toBe(true);
    s.terminar();
    vi.advanceTimersByTime(700);
    expect(s.visible()).toBe(false);
  });

  it('una consulta nueva mientras se va a ocultar mantiene la pantalla', () => {
    const s = TestBed.inject(CargandoService);
    s.iniciar();
    vi.advanceTimersByTime(200);
    s.terminar();
    s.iniciar();
    vi.advanceTimersByTime(2000);
    expect(s.visible()).toBe(true);
  });
});
