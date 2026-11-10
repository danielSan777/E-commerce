import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LectorDeVideo } from '../../../aplicacion/video';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { AdminPortadaInicio } from './portada-inicio';

// El navegador de pruebas no puede leer la duración de un video: se simula con la que cada prueba indique
const duracion = { valor: 5 as number | null };
const LECTOR = { provide: LectorDeVideo, useValue: { duracion: () => of(duracion.valor) } };

const URL = '/api/v1/admin/home/hero';
const esperar = () => new Promise<void>(r => setTimeout(r));
const evento = (archivo: File) => ({ target: { files: [archivo], value: 'x' } }) as unknown as Event;
const mp4 = (mb = 1) => { const f = new File(['v'], 'v.mp4', { type: 'video/mp4' }); Object.defineProperty(f, 'size', { value: mb * 1024 * 1024 }); return f; };
const IMAGEN = { id: 'i1', type: 'image', alt: 'Macetas', w: 1500, h: 1000, srcset: { '600': '/m-600.webp', '1080': '/m-1080.webp' } };
const VIDEO = { id: 'v1', type: 'video', url: '/media/home/v.mp4', poster: '/media/home/v-portada.webp', duration_s: 30 };

describe('AdminPortadaInicio', () => {
  let ctrl: HttpTestingController;

  async function montar(lista: object[] = []) {
    TestBed.configureTestingModule({ imports: [AdminPortadaInicio], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }, LECTOR] });
    ctrl = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminPortadaInicio);
    fixture.detectChanges();
    ctrl.expectOne(URL).flush({ data: lista });
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
    const f = await montar([IMAGEN]);
    expect(html(f).querySelector('img.vista')?.getAttribute('src')).toBe('/m-1080.webp');
    expect(html(f).textContent).toContain('Agregar a la portada');
  });

  it('muestra el video actual con su duración', async () => {
    const f = await montar([VIDEO]);
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
    expect(c.lista()).toHaveLength(1);
    expect(c.alt).toBe('');
  });

  it('video: más de un minuto se rechaza en el navegador, sin llamar a la API', async () => {
    const f = await montar();
    duracion.valor = 75;
    f.componentInstance.elegirVideo(evento(mp4()));
    expect(f.componentInstance.error()).toContain('un minuto');
    ctrl.verify();
  });

  it('video: lo que no es MP4 o pesa más de 100 MB tampoco sale del navegador', async () => {
    const f = await montar();
    duracion.valor = 10;
    f.componentInstance.elegirVideo(evento(new File(['v'], 'v.webm', { type: 'video/webm' })));
    expect(f.componentInstance.error()).toContain('MP4');
    f.componentInstance.elegirVideo(evento(mp4(105)));
    expect(f.componentInstance.error()).toContain('menos de 100 MB');
    ctrl.verify();
  });

  it('video: se sube con su portada y se suma a la lista (no reemplaza)', async () => {
    const f = await montar([IMAGEN]);
    const c = f.componentInstance;
    duracion.valor = 59;
    c.elegirPortada(evento(new File(['p'], 'p.jpg', { type: 'image/jpeg' })));
    c.elegirVideo(evento(mp4()));
    const req = ctrl.expectOne(URL);
    expect(((req.request.body as FormData).get('poster') as File).name).toBe('p.jpg');
    req.flush({ data: VIDEO }, { status: 201, statusText: 'Created' });
    await esperar();
    f.detectChanges();
    expect(c.lista().map(p => p.type)).toEqual(['image', 'video']);
    expect(c.portada()).toBeNull();
    expect(html(f).querySelector('video.vista')).not.toBeNull();
  });

  it('si Laravel rechaza el video muestra su mensaje y la lista no cambia', async () => {
    const f = await montar([IMAGEN]);
    duracion.valor = 20;
    f.componentInstance.elegirVideo(evento(mp4()));
    ctrl.expectOne(URL).flush({ code: 'validation_error', message: 'x', errors: { video: ['El video debe estar en H.264.'] } }, { status: 422, statusText: 'Unprocessable' });
    await esperar();
    expect(f.componentInstance.error()).toBe('El video debe estar en H.264.');
    expect(f.componentInstance.lista()).toHaveLength(1);
  });

  it('quitar pide confirmación, borra solo esa portada y con la lista vacía vuelve a la imagen de siempre', async () => {
    const f = await montar([VIDEO]);
    const c = f.componentInstance;
    c.confirmarQuitar.set('v1');
    c.quitar('v1');
    const req = ctrl.expectOne(`${URL}/v1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await esperar();
    f.detectChanges();
    expect(c.lista()).toEqual([]);
    expect(c.confirmarQuitar()).toBe('');
  });

  it('muestra varias portadas numeradas y quita una sin tocar las demás', async () => {
    const f = await montar([IMAGEN, VIDEO, { ...VIDEO, id: 'v2' }]);
    expect(html(f).querySelectorAll('.portada-item')).toHaveLength(3);
    expect(html(f).textContent).toContain('Portadas actuales (3)');
    f.componentInstance.quitar('v1');
    ctrl.expectOne(`${URL}/v1`).flush(null, { status: 204, statusText: 'No Content' });
    await esperar();
    f.detectChanges();
    expect(f.componentInstance.lista().map(p => p.id)).toEqual(['i1', 'v2']);
  });

  it('el botón de quitar no actúa hasta confirmar', async () => {
    const f = await montar([IMAGEN]);
    const boton = html(f).querySelector('.acciones .peligro') as HTMLButtonElement;
    boton.click();
    f.detectChanges();
    expect(html(f).textContent).toContain('¿Quitar esta portada?');
    ctrl.verify(); // todavía no se borró nada
  });

  it('la portada elegida para el video se ve como foto y se puede quitar', async () => {
    const original = globalThis.URL.createObjectURL;
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:portada-1');
    globalThis.URL.revokeObjectURL = vi.fn();
    try {
      const f = await montar();
      f.componentInstance.tipo.set('video');
      f.detectChanges();
      f.componentInstance.elegirPortada(evento(new File(['p'], 'CM_Punk.webp', { type: 'image/webp' })));
      f.detectChanges();

      expect(html(f).querySelector('.portada-elegida img')?.getAttribute('src')).toBe('blob:portada-1');
      expect(html(f).querySelector('.portada-elegida')?.textContent).toContain('CM_Punk.webp');
      expect(html(f).textContent).not.toContain('Ningún archivo');

      (html(f).querySelector('.portada-elegida button') as HTMLButtonElement).click();
      f.detectChanges();
      expect(f.componentInstance.portada()).toBeNull();
      expect(html(f).querySelector('.portada-elegida')).toBeNull();
    } finally { globalThis.URL.createObjectURL = original; }
  });

  it('en la sección de categorías usa su ruta, muestra los textos y los guarda', async () => {
    TestBed.configureTestingModule({ imports: [AdminPortadaInicio], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }, LECTOR,
      { provide: ActivatedRoute, useValue: { snapshot: { data: { seccion: 'categorias' } } } }] });
    ctrl = TestBed.inject(HttpTestingController);
    const f = TestBed.createComponent(AdminPortadaInicio);
    f.detectChanges();
    ctrl.expectOne('/api/v1/admin/categories-page/hero').flush({ data: [VIDEO] });
    ctrl.expectOne('/api/v1/admin/categories-page/text').flush({ data: { title: 'Hola', subtitle: null } });
    await esperar();
    f.detectChanges();
    expect(html(f).textContent).toContain('Encabezado de la página de categorías');
    expect((html(f).querySelector('#titulo-cat') as HTMLInputElement).value).toBe('Hola');

    f.componentInstance.titulo = 'Nuevo';
    f.componentInstance.guardarTexto();
    const req = ctrl.expectOne('/api/v1/admin/categories-page/text');
    expect(req.request.body).toEqual({ title: 'Nuevo', subtitle: '' });
    req.flush({ data: { title: 'Nuevo', subtitle: null } });
    f.componentInstance.quitar('v1');
    ctrl.expectOne('/api/v1/admin/categories-page/hero/v1').flush(null, { status: 204, statusText: 'No Content' });
  });
});
