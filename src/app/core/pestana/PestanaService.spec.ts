import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModoVentaService } from '../../catalogo/aplicacion/servicios/ModoVentaService';
import { UbicacionesService } from '../../checkout/aplicacion/servicios/UbicacionesService';
import { PestanaService, esRutaRecargable } from './PestanaService';

describe('esRutaRecargable', () => {
  it('permite pantallas públicas de solo lectura', () => {
    for (const r of ['/', '/categorias', '/producto/maceta-x', '/dia-de-la-madre', '/macetas/grandes?x=1']) expect(esRutaRecargable(r)).toBe(true);
  });
  it('protege pantallas con trabajo en curso', () => {
    for (const r of ['/carrito', '/checkout/pago', '/producto/maceta-x/personalizar', '/pedido/abc', '/mi-cuenta', '/admin/pedidos', '/ingresar']) expect(esRutaRecargable(r)).toBe(false);
  });
});

describe('PestanaService', () => {
  let url = '/';
  const modo = { recargar: vi.fn() };
  const ubic = { recargar: vi.fn() };
  let servicio: PestanaService;
  let recarga: ReturnType<typeof vi.fn<() => void>>;

  function cambiar(estado: 'hidden' | 'visible') {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => estado });
    document.dispatchEvent(new Event('visibilitychange'));
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-23T10:00:00Z'));
    modo.recargar.mockClear();
    ubic.recargar.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { get url() { return url; } } },
        { provide: ModoVentaService, useValue: modo },
        { provide: UbicacionesService, useValue: ubic },
      ],
    });
    servicio = TestBed.inject(PestanaService);
    recarga = vi.fn<() => void>();
    servicio.recargarPagina = recarga;
    servicio.iniciar();
  });
  afterEach(() => { servicio.detener(); vi.useRealTimers(); cambiar('visible'); });

  it('no hace nada si estuvo fuera menos de 30 s', () => {
    url = '/';
    cambiar('hidden');
    vi.advanceTimersByTime(10_000);
    cambiar('visible');
    expect(recarga).not.toHaveBeenCalled();
    expect(modo.recargar).not.toHaveBeenCalled();
  });

  it('recarga la página completa en una pantalla pública tras 30 s', () => {
    url = '/categorias';
    cambiar('hidden');
    vi.advanceTimersByTime(31_000);
    cambiar('visible');
    expect(recarga).toHaveBeenCalledTimes(1);
  });

  it('en una pantalla con trabajo en curso solo refresca los datos compartidos', () => {
    url = '/carrito';
    cambiar('hidden');
    vi.advanceTimersByTime(60_000);
    cambiar('visible');
    expect(recarga).not.toHaveBeenCalled();
    expect(modo.recargar).toHaveBeenCalledTimes(1);
    expect(ubic.recargar).toHaveBeenCalledTimes(1);
  });
});
