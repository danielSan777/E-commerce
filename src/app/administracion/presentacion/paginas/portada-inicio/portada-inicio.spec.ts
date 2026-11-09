import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LectorDeVideo } from '../../../aplicacion/video';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { AdminPortadaInicio } from './portada-inicio';

// El navegador de pruebas no puede leer la duración de un video: se simula con la que cada prueba indique
const duracion = { valor: 5 as number | null };
const LECTOR = { provide: LectorDeVideo, useValue: { duracion: () => of(duracion.valor) } };

const URL = '/api/v1/admin/home/hero';
const esperar = () => new Promise<void>(r => setTimeout(r));
const evento = (archivo: File) => ({ target: { files: [archivo], value: 'x' } }) as unknown as Event;
const mp4 = (mb = 1) => { const f = new File(['v'], 'v.mp4', { type: 'video/mp4' }); Object.defineProperty(f, 'size', { value: mb * 1024 * 1024 }); return f; };
const IMAGEN = { type: 'image', alt: 'Macetas', w: 1500, h: 1000, srcset: { '600': '/m-600.webp', '1080': '/m-1080.webp' } };
const VIDEO = { type: 'video', url: '/media/home/v.mp4', poster: '/media/home/v-portada.webp', duration_s: 30 };

describe('AdminPortadaInicio', () => {
  let ctrl: HttpTestingController;

  async function montar(actual: object | null = null) {
    TestBed.configureTestingModule({ imports: [AdminPortadaInicio], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }, LECTOR] });
    ctrl = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminPortadaInicio);
    fixture.detectChanges();
    ctrl.expectOne(URL).flush({ data: actual });
    await esperar();
    fixture.detectChanges();
    return fixture;
  }
  const html = (f: Awaited<ReturnType<typeof montar>>) => f.nativeElement as HTMLElement;

  it('sin portada explica que se ve la imagen de siempre', async () => {
    const f = await montar();
    expect(html(f).textContent).toContain('se ve la imagen de siempre');
    expect(html(f).querySelector('.vista')).toBeNull();
  });

  it('muestra la imagen actual', async () => {
    const f = await montar(IMAGEN);
    expect(html(f).querySelector('img.vista')?.getAttribute('src')).toBe('/m-1080.webp');
    expect(html(f).textContent).toContain('Cambiar la portada');
  });

  it('muestra el video actual con su duración', async () => {
    const f = await montar(VIDEO);
    expect(html(f).querySelector('video.vista')?.getAttribute('src')).toBe('/media/home/v.mp4');
    expect(html(f).textContent).toContain('30 s');
  });

  it('imagen: exige la descripción, el tipo y el peso antes de llamar a la API', async () => {
    const f = await montar();
    const c = f.componentInstance;
    c.alt = ' ';
    c.elegirImagen(evento(new File(['x'], 'a.png', { type: 'image/png' })));
    expect(c.error()).toBe('Escribe la descripción de la imagen antes de subirla.');
    c.alt = 'Macetas';
    c.elegirImagen(evento(new File(['x'], 'a.gif', { type: 'image/gif' })));
    expect(c.error()).toBe('Elige una imagen JPG, PNG o WebP.');
    ctrl.verify();
  });

  it('imagen: la sube y pasa a ser la portada actual', async () => {
    const f = await montar();
    const c = f.componentInstance;
    c.alt = 'Macetas';
    c.elegirImagen(evento(new File(['x'], 'a.png', { type: 'image/png' })));
    const req = ctrl.expectOne(URL);
    expect((req.request.body as FormData).get('alt')).toBe('Macetas');
    req.flush({ data: IMAGEN }, { status: 201, statusText: 'Created' });
    await esperar();
    f.detectChanges();
    expect(c.actual()?.type).toBe('image');
    expect(c.alt).toBe('');
  });

  it('video: más de un minuto se rechaza en el navegador, sin llamar a la API', async () => {
    const f = await montar();
    duracion.valor = 75;
    f.componentInstance.elegirVideo(evento(mp4()));
    expect(f.componentInstance.error()).toContain('un minuto');
    ctrl.verify();
  });

  it('video: lo que no es MP4 o pesa más de 20 MB tampoco sale del navegador', async () => {
    const f = await montar();
    duracion.valor = 10;
    f.componentInstance.elegirVideo(evento(new File(['v'], 'v.webm', { type: 'video/webm' })));
    expect(f.componentInstance.error()).toContain('MP4');
    f.componentInstance.elegirVideo(evento(mp4(25)));
    expect(f.componentInstance.error()).toContain('menos de 20 MB');
    ctrl.verify();
  });

  it('video: se sube con su portada y reemplaza a la imagen actual', async () => {
    const f = await montar(IMAGEN);
    const c = f.componentInstance;
    duracion.valor = 59;
    c.elegirPortada(evento(new File(['p'], 'p.jpg', { type: 'image/jpeg' })));
    c.elegirVideo(evento(mp4()));
    const req = ctrl.expectOne(URL);
    expect(((req.request.body as FormData).get('poster') as File).name).toBe('p.jpg');
    req.flush({ data: VIDEO }, { status: 201, statusText: 'Created' });
    await esperar();
    f.detectChanges();
    expect(c.actual()?.type).toBe('video');
    expect(c.portada()).toBeNull();
    expect(html(f).querySelector('video.vista')).not.toBeNull();
  });

  it('si Laravel rechaza el video muestra su mensaje y la portada actual no cambia', async () => {
    const f = await montar(IMAGEN);
    duracion.valor = 20;
    f.componentInstance.elegirVideo(evento(mp4()));
    ctrl.expectOne(URL).flush({ code: 'validation_error', message: 'x', errors: { video: ['El video debe estar en H.264.'] } }, { status: 422, statusText: 'Unprocessable' });
    await esperar();
    expect(f.componentInstance.error()).toBe('El video debe estar en H.264.');
    expect(f.componentInstance.actual()?.type).toBe('image');
  });

  it('quitar pide confirmación y vuelve a la imagen de siempre', async () => {
    const f = await montar(VIDEO);
    const c = f.componentInstance;
    c.confirmarQuitar.set(true);
    c.quitar();
    const req = ctrl.expectOne(URL);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await esperar();
    f.detectChanges();
    expect(c.actual()).toBeNull();
    expect(c.confirmarQuitar()).toBe(false);
  });

  it('el botón de quitar no actúa hasta confirmar', async () => {
    const f = await montar(IMAGEN);
    const boton = html(f).querySelector('.acciones .peligro') as HTMLButtonElement;
    boton.click();
    f.detectChanges();
    expect(html(f).textContent).toContain('¿Quitar la portada?');
    ctrl.verify(); // todavía no se borró nada
  });
});
