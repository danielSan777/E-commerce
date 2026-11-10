import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../configuracion/api';
import { RESUMEN_CATEGORIAS_API } from '../../testing/catalogo-api';
import { PrecargaService } from './PrecargaService';

describe('PrecargaService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (window as { requestIdleCallback?: unknown }).requestIdleCallback = (cb: () => void) => setTimeout(cb, 0);
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
  });
  afterEach(() => { vi.useRealTimers(); delete (window as { requestIdleCallback?: unknown }).requestIdleCallback; });

  it('adelanta las categorías, cada una con sus productos, y el encabezado de /categorias', () => {
    const ctrl = TestBed.inject(HttpTestingController);
    TestBed.inject(PrecargaService).iniciar();
    vi.advanceTimersByTime(10);

    ctrl.expectOne('/api/v1/categories-page').flush({ title: null, subtitle: null, items: [] });
    ctrl.expectOne('/api/v1/categories').flush({ data: RESUMEN_CATEGORIAS_API });
    const pedidas = RESUMEN_CATEGORIAS_API.map(c => `/api/v1/categories/${c.slug}`);
    pedidas.forEach(u => ctrl.expectOne(u).flush({}, { status: 500, statusText: 'x' })); // un error no rompe nada
    ctrl.verify();
  });

  it('solo lo hace una vez', () => {
    const ctrl = TestBed.inject(HttpTestingController);
    const p = TestBed.inject(PrecargaService);
    p.iniciar(); p.iniciar();
    vi.advanceTimersByTime(10);
    ctrl.expectOne('/api/v1/categories-page').flush({ title: null, subtitle: null, items: [] });
    ctrl.expectOne('/api/v1/categories').flush({ data: [] });
    ctrl.verify();
  });
});

describe('PrecargaDePantallas', () => {
  it('descarga las pantallas de la tienda pero no las del panel', async () => {
    const { PrecargaDePantallas } = await import('../../app.config');
    const e = new PrecargaDePantallas();
    const descargar = vi.fn(() => ({ pasoPorAqui: true }) as never);
    e.preload({ path: 'categorias' }, descargar);
    e.preload({ path: 'admin/productos' }, descargar);
    expect(descargar).toHaveBeenCalledTimes(1);
  });
});
