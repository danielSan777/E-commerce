import { firstValueFrom } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../core/configuracion/api';
import { ImagenesAdminService } from './ImagenesAdminService';

describe('ImagenesAdminService', () => {
  let servicio: ImagenesAdminService;
  let ctrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    servicio = TestBed.inject(ImagenesAdminService);
    ctrl = TestBed.inject(HttpTestingController);
  });

  it('lista las imágenes de un producto', async () => {
    const p = firstValueFrom(servicio.listar('products', 'PRO-1'));
    ctrl.expectOne('/api/v1/admin/products/PRO-1/media').flush({ data: [{ id: 1 }] });
    expect((await p).length).toBe(1);
  });

  it('sube el archivo como formulario con tipo y descripción', async () => {
    const archivo = new File(['x'], 'a.png', { type: 'image/png' });
    const p = firstValueFrom(servicio.subir('categories', 'familia', archivo, 'hero', ' Banner '));
    const req = ctrl.expectOne('/api/v1/admin/categories/familia/media');
    expect(req.request.method).toBe('POST');
    const cuerpo = req.request.body as FormData;
    expect((cuerpo.get('image') as File).name).toBe('a.png');
    expect(cuerpo.get('role')).toBe('hero');
    expect(cuerpo.get('alt')).toBe('Banner');
    req.flush({ id: 5 }, { status: 201, statusText: 'Created' });
    expect((await p).id).toBe(5);
  });

  it('muestra el mensaje de Laravel cuando el archivo no sirve', async () => {
    const p = firstValueFrom(servicio.subir('products', 'PRO-1', new File(['x'], 'a.png', { type: 'image/png' }), 'front', ''));
    ctrl.expectOne('/api/v1/admin/products/PRO-1/media').flush(
      { code: 'validation_error', message: 'Revisa los datos ingresados.', errors: { image: ['El archivo no es una imagen válida. Usa JPG, PNG o WebP.'] } },
      { status: 422, statusText: 'Unprocessable' },
    );
    await expect(p).rejects.toMatchObject({ errors: { image: ['El archivo no es una imagen válida. Usa JPG, PNG o WebP.'] } });
  });

  it('edita y elimina por id', async () => {
    const e = firstValueFrom(servicio.editar(7, { alt: 'x' }));
    const put = ctrl.expectOne('/api/v1/admin/media/7');
    expect(put.request.method).toBe('PUT');
    put.flush({ id: 7 });
    await e;
    const d = firstValueFrom(servicio.eliminar(7));
    const del = ctrl.expectOne('/api/v1/admin/media/7');
    expect(del.request.method).toBe('DELETE');
    del.flush(null, { status: 204, statusText: 'No Content' });
    await d;
  });
});
