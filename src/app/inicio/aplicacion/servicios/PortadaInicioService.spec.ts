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

  it('devuelve la portada que eligió el administrador', async () => {
    const p = firstValueFrom(servicio.portada());
    ctrl.expectOne('/api/v1/home/hero').flush({ data: { type: 'video', url: '/v.mp4', poster: null, duration_s: 9 } });
    expect(await p).toMatchObject({ type: 'video', url: '/v.mp4' });
  });

  it('sin portada devuelve null', async () => {
    const p = firstValueFrom(servicio.portada());
    ctrl.expectOne('/api/v1/home/hero').flush({ data: null });
    expect(await p).toBeNull();
  });

  it('si la API falla, la tienda no se rompe: devuelve null y usa su imagen de siempre', async () => {
    const p = firstValueFrom(servicio.portada());
    ctrl.expectOne('/api/v1/home/hero').flush({ message: 'x' }, { status: 500, statusText: 'Error' });
    expect(await p).toBeNull();
  });
});
