import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../../core/configuracion/api';
import { GaleriaImagenes } from './galeria-imagenes';

const BASE = '/api/v1/admin/products/PRO-1/media';
const img = (id: number, extra = {}) => ({ id, type: 'image', role: 'front', alt: null, sort_order: id, width: 1500, height: 1000, urls: { '600': `/media/a${id}-600.webp`, '1080': `/media/a${id}-1080.webp` }, ...extra });
const esperar = () => new Promise<void>(r => setTimeout(r));
const evento = (archivo: File) => ({ target: { files: [archivo], value: 'x' } }) as unknown as Event;

describe('GaleriaImagenes', () => {
  let ctrl: HttpTestingController;

  async function montar(lista = [img(1)]) {
    TestBed.configureTestingModule({ imports: [GaleriaImagenes], providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    ctrl = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(GaleriaImagenes);
    fixture.componentRef.setInput('dueno', 'products');
    fixture.componentRef.setInput('clave', 'PRO-1');
    fixture.detectChanges();
    ctrl.expectOne(BASE).flush({ data: lista });
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
});
