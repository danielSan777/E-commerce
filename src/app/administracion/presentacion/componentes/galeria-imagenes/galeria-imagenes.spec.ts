import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LectorDeVideo } from '../../../aplicacion/video';
import { API_URL } from '../../../../core/configuracion/api';
import { GaleriaImagenes } from './galeria-imagenes';

// El navegador de pruebas no puede leer la duración de un video: se simula con la que cada prueba indique
const duracion = { valor: 5 as number | null };
const LECTOR = { provide: LectorDeVideo, useValue: { duracion: () => of(duracion.valor) } };

const BASE = '/api/v1/admin/products/PRO-1/media';
const img = (id: number, extra = {}) => ({ id, type: 'image', role: 'front', alt: null, sort_order: id, width: 1500, height: 1000, urls: { '600': `/media/a${id}-600.webp`, '1080': `/media/a${id}-1080.webp` }, ...extra });
const esperar = () => new Promise<void>(r => setTimeout(r));
const evento = (archivo: File) => ({ target: { files: [archivo], value: 'x' } }) as unknown as Event;

describe('GaleriaImagenes', () => {
  let ctrl: HttpTestingController;

  async function montar(lista: object[] = [img(1)], dueno: 'products' | 'categories' | 'campaigns' = 'products', clave = 'PRO-1') {
    const base = `/api/v1/admin/${dueno}/${clave}/media`;
    TestBed.configureTestingModule({ imports: [GaleriaImagenes], providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }, LECTOR] });
    ctrl = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(GaleriaImagenes);
    fixture.componentRef.setInput('dueno', dueno);
    fixture.componentRef.setInput('clave', clave);
    fixture.detectChanges();
    ctrl.expectOne(base).flush({ data: lista });
    await esperar();
    fixture.detectChanges();
    return fixture;
  }

  it('muestra las miniaturas con su versión de 600 px', async () => {
    const fixture = await montar();
    expect(fixture.nativeElement.querySelector('.imagenes img').getAttribute('src')).toBe('/media/a1-600.webp');
  });

  it('no sube la imagen si falta la descripción', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    c.alt = '   ';
    await c.elegir(evento(new File(['x'], 'a.png', { type: 'image/png' })));
    expect(c.error()).toBe('Escribe la descripción de la imagen antes de subirla.');
    ctrl.verify();
  });

  it('no guarda una descripción vacía al editar', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    await c.guardarDatos(c.imagenes()[0], ' ', 'front');
    expect(c.error()).toBe('La descripción de la imagen no puede quedar vacía.');
    ctrl.verify();
  });

  it('no llama a la API si el archivo no es JPG, PNG o WebP', async () => {
    const fixture = await montar();
    fixture.componentInstance.alt = 'x';
    await fixture.componentInstance.elegir(evento(new File(['x'], 'a.gif', { type: 'image/gif' })));
    expect(fixture.componentInstance.error()).toBe('Elige una imagen JPG, PNG o WebP.');
    ctrl.verify();
  });

  it('no llama a la API si pesa más de 8 MB', async () => {
    const fixture = await montar();
    fixture.componentInstance.alt = 'x';
    const grande = new File([new Uint8Array(8 * 1024 * 1024 + 1)], 'a.png', { type: 'image/png' });
    await fixture.componentInstance.elegir(evento(grande));
    expect(fixture.componentInstance.error()).toBe('La imagen debe pesar menos de 8 MB.');
    ctrl.verify();
  });

  it('sube la imagen y la agrega a la lista', async () => {
    const fixture = await montar([]);
    const c = fixture.componentInstance;
    c.rol = 'detail';
    c.alt = 'Doctor con lentes';
    const p = c.elegir(evento(new File(['x'], 'a.png', { type: 'image/png' })));
    const req = ctrl.expectOne(BASE);
    expect((req.request.body as FormData).get('role')).toBe('detail');
    req.flush(img(9), { status: 201, statusText: 'Created' });
    await p;
    expect(c.imagenes().length).toBe(1);
    expect(c.aviso()).toBe('Imagen subida.');
  });

  it('muestra el mensaje de Laravel si rechaza la imagen', async () => {
    const fixture = await montar([]);
    const c = fixture.componentInstance;
    c.alt = 'Doctor';
    const p = c.elegir(evento(new File(['x'], 'a.png', { type: 'image/png' })));
    ctrl.expectOne(BASE).flush(
      { code: 'validation_error', message: 'Revisa los datos ingresados.', errors: { image: ['La imagen es muy pequeña. Debe medir al menos 300 × 300 píxeles.'] } },
      { status: 422, statusText: 'Unprocessable' },
    );
    await p;
    expect(c.error()).toBe('La imagen es muy pequeña. Debe medir al menos 300 × 300 píxeles.');
    expect(c.imagenes().length).toBe(0);
  });

  it('elimina la imagen y la quita de la lista', async () => {
    const fixture = await montar([img(1), img(2)]);
    const c = fixture.componentInstance;
    const p = c.eliminar(1);
    ctrl.expectOne('/api/v1/admin/media/1').flush(null, { status: 204, statusText: 'No Content' });
    await p;
    expect(c.imagenes().map(i => i.id)).toEqual([2]);
  });

  it('guarda la descripción y el tipo', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    const p = c.guardarDatos(c.imagenes()[0], ' Homero ', 'detail');
    const req = ctrl.expectOne('/api/v1/admin/media/1');
    expect(req.request.body).toEqual({ alt: 'Homero', role: 'detail' });
    req.flush(img(1, { alt: 'Homero', role: 'detail' }));
    await p;
    expect(c.imagenes()[0].alt).toBe('Homero');
  });

  it('si ya hay una principal, bloquea "Principal" para la imagen nueva y para las demás', async () => {
    const fixture = await montar([img(1), img(2, { role: 'detail' })]);
    const html = fixture.nativeElement as HTMLElement;
    const opcionFront = (select: Element) => Array.from(select.querySelectorAll('option')).find(o => o.value === 'front')!;

    expect(fixture.componentInstance.principalId()).toBe(1);
    // select de "subir imagen nueva": bloqueado, y el tipo elegido deja de ser "Principal"
    expect(opcionFront(html.querySelector('#rol-imagen')!).disabled).toBe(true);
    expect(fixture.componentInstance.rol).toBe('angle');
    // select de cada imagen: la principal conserva su opción; la otra la tiene bloqueada
    const selects = html.querySelectorAll('.imagenes select');
    expect(opcionFront(selects[0]).disabled).toBe(false);
    expect(opcionFront(selects[1]).disabled).toBe(true);
  });

  it('sin principal, "Principal" está disponible y se vuelve a bloquear al subirla', async () => {
    const fixture = await montar([]);
    const c = fixture.componentInstance;
    const html = fixture.nativeElement as HTMLElement;
    expect(c.principalId()).toBeNull();
    expect(c.rol).toBe('front');
    expect((Array.from(html.querySelectorAll('#rol-imagen option')).find(o => (o as HTMLOptionElement).value === 'front') as HTMLOptionElement).disabled).toBe(false);

    c.alt = 'Doctor';
    const p = c.elegir(evento(new File(['x'], 'a.png', { type: 'image/png' })));
    ctrl.expectOne(BASE).flush(img(3), { status: 201, statusText: 'Created' });
    await p;
    expect(c.principalId()).toBe(3);
    expect(c.rol).toBe('angle');
  });

  it('al eliminar la principal, el tipo queda libre', async () => {
    const fixture = await montar([img(1)]);
    const c = fixture.componentInstance;
    const p = c.eliminar(1);
    ctrl.expectOne('/api/v1/admin/media/1').flush(null, { status: 204, statusText: 'No Content' });
    await p;
    expect(c.principalId()).toBeNull();
    expect(c.rol).toBe('front');
  });

  it('muestra el mensaje de Laravel si rechaza marcar otra principal', async () => {
    const fixture = await montar([img(1), img(2, { role: 'detail' })]);
    const c = fixture.componentInstance;
    const p = c.guardarDatos(c.imagenes()[1], 'Detalle', 'front');
    ctrl.expectOne('/api/v1/admin/media/2').flush(
      { code: 'validation_error', message: 'Revisa los datos ingresados.', errors: { role: ['Ya hay una imagen principal. Cambia primero su tipo (por ejemplo a "Otro ángulo") para marcar otra.'] } },
      { status: 422, statusText: 'Unprocessable' },
    );
    await p;
    expect(c.error()).toContain('Ya hay una imagen principal');
  });

  it('el botón de subir está bloqueado hasta escribir la descripción y explica por qué', async () => {
    const fixture = await montar([]);
    const html = fixture.nativeElement as HTMLElement;
    const archivo = () => html.querySelector<HTMLInputElement>('input[type=file]')!;
    const aviso = () => html.querySelector('.subir .campo-error')?.textContent ?? '';

    expect(archivo().disabled).toBe(true);
    expect(html.querySelector('label.boton')!.classList).toContain('desactivado');
    expect(aviso()).toContain('Escribe una descripción antes de subir una imagen.');

    const campo = html.querySelector<HTMLInputElement>('#alt-imagen')!;
    campo.value = 'Doctor con lentes';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(archivo().disabled).toBe(false);
    expect(html.querySelector('label.boton')!.classList).not.toContain('desactivado');
    expect(aviso()).toBe('');

    campo.value = '   ';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(archivo().disabled).toBe(true);
  });

  // ===== Video =====
  const mp4 = (mb = 1, nombre = 'v.mp4') => { const f = new File(['v'], nombre, { type: 'video/mp4' }); Object.defineProperty(f, 'size', { value: mb * 1024 * 1024 }); return f; };
  const video = (id: number) => ({ id, type: 'video', role: 'video', alt: null, sort_order: id, width: 720, height: 1280, duration_s: 5, urls: { url: '/media/v.mp4', poster: '/media/v-portada.webp' } });

  it('producto: un video de más de un minuto se rechaza en el navegador, sin llamar a la API', async () => {
    const fixture = await montar();
    duracion.valor = 75;
    fixture.componentInstance.elegirVideo(evento(mp4()));
    expect(fixture.componentInstance.error()).toContain('un minuto');
    expect(fixture.componentInstance.error()).toContain('dura 75 s');
    ctrl.verify();
  });

  it('producto: acepta 1 minuto justo y lo sube a /video con su portada', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    duracion.valor = 60;
    c.elegirPortada(evento(new File(['p'], 'p.png', { type: 'image/png' })));
    c.elegirVideo(evento(mp4()));

    const req = ctrl.expectOne('/api/v1/admin/products/PRO-1/video');
    expect(req.request.method).toBe('POST');
    expect(((req.request.body as FormData).get('video') as File).name).toBe('v.mp4');
    expect(((req.request.body as FormData).get('poster') as File).name).toBe('p.png');
    req.flush(video(7));
    await esperar();
    fixture.detectChanges();

    expect(c.hayVideo()).toBe(true);
    expect(c.portada()).toBeNull();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('.imagenes video')?.getAttribute('src')).toBe('/media/v.mp4');
    expect(html.textContent).not.toContain('Ya hay un video');
    expect(html.querySelector('.subir.video input[accept="video/mp4"]')).not.toBeNull(); // se pueden subir más videos
  });

  it('no sube lo que no es MP4 ni lo que pesa de más (100 MB)', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    duracion.valor = 3;
    c.elegirVideo(evento(new File(['v'], 'v.mov', { type: 'video/quicktime' })));
    expect(c.error()).toContain('MP4');
    c.elegirVideo(evento(mp4(101)));
    expect(c.error()).toContain('menos de 100 MB');
    ctrl.verify();
  });

  it('categoría: el video del banner puede durar hasta un minuto', async () => {
    const fixture = await montar([], 'categories', 'amor');
    const c = fixture.componentInstance;
    duracion.valor = 75;
    c.elegirVideo(evento(mp4(2)));
    expect(c.error()).toContain('un minuto');
    ctrl.verify();

    duracion.valor = 45;
    c.elegirVideo(evento(mp4(10)));
    ctrl.expectOne('/api/v1/admin/categories/amor/video').flush(video(1));
    await esperar();
    expect(c.hayVideo()).toBe(true);
  });

  it('si Laravel rechaza el video, se muestra su mensaje', async () => {
    const fixture = await montar();
    duracion.valor = 5;
    fixture.componentInstance.elegirVideo(evento(mp4()));
    ctrl.expectOne('/api/v1/admin/products/PRO-1/video').flush({ code: 'validation_error', message: 'x', errors: { video: ['El video debe estar en H.264.'] } }, { status: 422, statusText: 'Unprocessable' });
    await esperar();
    expect(fixture.componentInstance.error()).toBe('El video debe estar en H.264.');
    expect(fixture.componentInstance.hayVideo()).toBe(false);
  });

  it('la portada del video debe ser una imagen', async () => {
    const fixture = await montar();
    fixture.componentInstance.elegirPortada(evento(new File(['x'], 'p.gif', { type: 'image/gif' })));
    expect(fixture.componentInstance.error()).toContain('portada del video');
    expect(fixture.componentInstance.portada()).toBeNull();
  });

  it('el video ya subido se ve en la lista y se puede eliminar', async () => {
    const fixture = await montar([img(1), video(2)]);
    const c = fixture.componentInstance;
    expect(c.hayVideo()).toBe(true);
    c.eliminar(2);
    const req = ctrl.expectOne('/api/v1/admin/media/2');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await esperar();
    fixture.detectChanges();
    expect(c.hayVideo()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('.subir.video input[accept="video/mp4"]')).not.toBeNull(); // se puede subir otro
  });

  it('las campañas también aceptan video de portada (hasta 1 minuto)', async () => {
    const fixture = await montar([], 'campaigns', 'san-valentin');
    expect(fixture.componentInstance.puedeVideo()).toBe(true);
    expect(fixture.componentInstance.limiteVideo().segundos).toBe(60);
    expect((fixture.nativeElement as HTMLElement).querySelector('.subir.video')).not.toBeNull();
  });

  it('la portada elegida se ve como foto (no solo su nombre) y se puede quitar', async () => {
    const original = URL.createObjectURL;
    const liberada = vi.fn();
    URL.createObjectURL = vi.fn(() => 'blob:portada-1');
    URL.revokeObjectURL = liberada;
    try {
      const fixture = await montar();
      const c = fixture.componentInstance;
      c.elegirPortada(evento(new File(['p'], 'CM_Punk.webp', { type: 'image/webp' })));
      fixture.detectChanges();

      const html = fixture.nativeElement as HTMLElement;
      expect(html.querySelector('.portada-elegida img')?.getAttribute('src')).toBe('blob:portada-1');
      expect(html.querySelector('.portada-elegida')?.textContent).toContain('CM_Punk.webp');
      expect(html.textContent).not.toContain('Ningún archivo');

      (html.querySelector('.portada-elegida button') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(c.portada()).toBeNull();
      expect(liberada).toHaveBeenCalledWith('blob:portada-1');
      expect(html.querySelector('.portada-elegida')).toBeNull();
    } finally { URL.createObjectURL = original; }
  });
});
