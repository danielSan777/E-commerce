import { firstValueFrom } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../core/configuracion/api';
import { PortadaInicioAdminService } from './PortadaInicioAdminService';

describe('PortadaInicioAdminService', () => {
  let servicio: PortadaInicioAdminService;
  let ctrl: HttpTestingController;
  const URL = '/api/v1/admin/home/hero';

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    servicio = TestBed.inject(PortadaInicioAdminService);
    ctrl = TestBed.inject(HttpTestingController);
  });
  afterEach(() => ctrl.verify());

  it('lista las portadas actuales (vacía si no hay)', async () => {
    const a = firstValueFrom(servicio.lista());
    ctrl.expectOne(URL).flush({ data: [] });
    expect(await a).toEqual([]);
    const b = firstValueFrom(servicio.lista());
    ctrl.expectOne(URL).flush({ data: [{ id: 'a1', type: 'video', url: '/media/home/v.mp4', poster: null, duration_s: 30 }] });
    expect(await b).toMatchObject([{ id: 'a1', type: 'video', duration_s: 30 }]);
  });

  it('sube una imagen con su descripción', async () => {
    const p = firstValueFrom(servicio.subirImagen(new File(['x'], 'a.png', { type: 'image/png' }), ' Maceta '));
    const req = ctrl.expectOne(URL);
    expect(req.request.method).toBe('POST');
    expect((req.request.body as FormData).get('alt')).toBe('Maceta');
    expect(((req.request.body as FormData).get('image') as File).name).toBe('a.png');
    req.flush({ data: { type: 'image', alt: 'Maceta', srcset: { '1080': '/m.webp' } } });
    expect((await p).type).toBe('image');
  });

  it('sube un video con portada opcional', async () => {
    const p = firstValueFrom(servicio.subirVideo(new File(['v'], 'v.mp4', { type: 'video/mp4' }), new File(['p'], 'p.png', { type: 'image/png' })));
    const req = ctrl.expectOne(URL);
    const cuerpo = req.request.body as FormData;
    expect((cuerpo.get('video') as File).name).toBe('v.mp4');
    expect((cuerpo.get('poster') as File).name).toBe('p.png');
    expect(cuerpo.has('image')).toBe(false);
    req.flush({ data: { type: 'video', url: '/v.mp4', poster: '/p.webp', duration_s: 20 } });
    expect((await p).type).toBe('video');
  });

  it('quita una portada con DELETE usando su id', async () => {
    const p = firstValueFrom(servicio.quitar('a1'));
    const req = ctrl.expectOne(`${URL}/a1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await p;
  });
});
