import { firstValueFrom } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../core/configuracion/api';
import { PortadaInicioService } from './PortadaInicioService';

describe('PortadaInicioService', () => {
  let servicio: PortadaInicioService;
  let ctrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    servicio = TestBed.inject(PortadaInicioService);
    ctrl = TestBed.inject(HttpTestingController);
  });
  afterEach(() => ctrl.verify());

  it('devuelve la lista de portadas que eligió el administrador, en orden', async () => {
    const p = firstValueFrom(servicio.portadas());
    const a = { type: 'video', url: '/v.mp4', poster: null, duration_s: 9 };
    const b = { type: 'image', alt: 'x', srcset: { '1080': '/m.webp' } };
    ctrl.expectOne('/api/v1/home/hero').flush({ data: a, items: [a, b] });
    expect(await p).toMatchObject([{ type: 'video' }, { type: 'image' }]);
  });

  it('con una API anterior (solo data) sigue funcionando', async () => {
    const p = firstValueFrom(servicio.portadas());
    ctrl.expectOne('/api/v1/home/hero').flush({ data: { type: 'video', url: '/v.mp4', poster: null, duration_s: 9 } });
    expect(await p).toHaveLength(1);
  });

  it('sin portada devuelve lista vacía', async () => {
    const p = firstValueFrom(servicio.portadas());
    ctrl.expectOne('/api/v1/home/hero').flush({ data: null, items: [] });
    expect(await p).toEqual([]);
  });

  it('si la API falla, la tienda no se rompe: lista vacía y usa su imagen de siempre', async () => {
    const p = firstValueFrom(servicio.portadas());
    ctrl.expectOne('/api/v1/home/hero').flush({ message: 'x' }, { status: 500, statusText: 'Error' });
    expect(await p).toEqual([]);
  });
});
