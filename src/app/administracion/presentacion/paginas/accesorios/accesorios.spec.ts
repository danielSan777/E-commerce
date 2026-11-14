import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { AdminAccesorios } from './accesorios';

const BASE = '/api/v1/admin';
const esperar = () => new Promise<void>(r => setTimeout(r, 0));
const BALANZA = {
  id: 5, name: 'Balanza', type: 'imagen' as const, behavior: null, text: null, category_id: 1, category: 'objetos',
  image: 'https://api/media/accessories/5-aaa-1080.webp', thumb: null, alt: 'balanza', sort_order: 1, is_active: true, is_exclusive: false,
};

describe('AdminAccesorios · imagen del accesorio', () => {
  let ctrl: HttpTestingController;

  async function montar() {
    TestBed.configureTestingModule({ imports: [AdminAccesorios], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    ctrl = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminAccesorios);
    fixture.detectChanges();
    await responderCarga();
    fixture.detectChanges();
    return fixture;
  }

  async function responderCarga() {
    ctrl.expectOne(`${BASE}/accessory-categories`).flush({ data: [{ id: 1, name: 'objetos', sort_order: 1, accessories_count: 1 }] });
    ctrl.expectOne(`${BASE}/accessories`).flush({ data: [BALANZA] });
    ctrl.expectOne(`${BASE}/locations`).flush({ data: [] });
    await esperar();
  }

  const eleccion = (archivo: File) => ({ target: { files: [archivo] } }) as unknown as Event;

  afterEach(() => ctrl.verify());

  it('al subir otra imagen se envía la nueva (Laravel borra la anterior) y el formulario no conserva el archivo', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    c.editarAccesorio(BALANZA);
    fixture.detectChanges();
    expect(c.vistaPrevia()).toBe(BALANZA.image);

    const nueva = new File(['x'], 'balanza-nueva.png', { type: 'image/png' });
    c.elegirImagen(eleccion(nueva));
    expect(c.vistaPrevia()?.startsWith('blob:')).toBe(true);
    c.formAccesorio.alt = 'balanza dorada';
    c.guardarAccesorio();

    ctrl.expectOne(r => r.method === 'PUT' && r.url === `${BASE}/accessories/5`).flush(BALANZA);
    const subida = ctrl.expectOne(`${BASE}/accessories/5/image`);
    const datos = subida.request.body as FormData;
    expect((datos.get('image') as File).name).toBe('balanza-nueva.png');
    expect(datos.get('alt')).toBe('balanza dorada');
    subida.flush({ ...BALANZA, image: 'https://api/media/accessories/5-bbb-1080.webp' });
    await responderCarga();

    expect(c.archivoImagen).toBeNull();
    expect(c.vistaPrevia()).toBeNull();
    expect(c.editandoAccesorio()).toBeNull();
  });

  it('si cancelas, el archivo elegido se olvida también en el campo y no se sube al editar otro accesorio', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    c.editarAccesorio(BALANZA);
    fixture.detectChanges();
    const campo = fixture.nativeElement.querySelector('#a-imagen') as HTMLInputElement;
    expect(campo).not.toBeNull();

    c.elegirImagen(eleccion(new File(['x'], 'otra.png', { type: 'image/png' })));
    c.cancelarAccesorio();
    expect(c.archivoImagen).toBeNull();

    c.editarAccesorio({ ...BALANZA, id: 6, name: 'Corazón' });
    fixture.detectChanges();
    c.guardarAccesorio();
    ctrl.expectOne(r => r.method === 'PUT' && r.url === `${BASE}/accessories/6`).flush({ ...BALANZA, id: 6 });
    await responderCarga();
    // Sin archivo nuevo no hay subida: se conserva la imagen actual
    ctrl.expectNone(`${BASE}/accessories/6/image`);
  });
});
