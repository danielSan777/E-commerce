import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../core/configuracion/api';
import { ProductosAdminService } from './ProductosAdminService';

describe('ProductosAdminService', () => {
  let servicio: ProductosAdminService;
  let ctrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    servicio = TestBed.inject(ProductosAdminService);
    ctrl = TestBed.inject(HttpTestingController);
  });

  it('listar envía categoría y búsqueda como parámetros', async () => {
    const p = servicio.listar('profesiones-y-hobbies', ' doctor ');
    const req = ctrl.expectOne(r => r.url === '/api/v1/admin/products');
    expect(req.request.params.get('category')).toBe('profesiones-y-hobbies');
    expect(req.request.params.get('q')).toBe('doctor');
    req.flush({ data: [{ sku: 'D-1' }] });
    expect((await p).length).toBe(1);
  });

  it('listar sin filtros no envía parámetros', async () => {
    const p = servicio.listar();
    const req = ctrl.expectOne(r => r.url === '/api/v1/admin/products');
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ data: [] });
    await p;
  });

  it('editar usa el SKU en la dirección y eliminar usa DELETE', async () => {
    const e = servicio.editar('JDS-1', { name: 'X' } as never);
    const put = ctrl.expectOne('/api/v1/admin/products/JDS-1');
    expect(put.request.method).toBe('PUT');
    put.flush({});
    await e;

    const d = servicio.eliminar('JDS-1');
    const del = ctrl.expectOne('/api/v1/admin/products/JDS-1');
    expect(del.request.method).toBe('DELETE');
    del.flush(null, { status: 204, statusText: 'No Content' });
    await d;
  });

  it('convierte los errores de la API en mensaje en español', async () => {
    const p = servicio.ver('NO');
    ctrl.expectOne('/api/v1/admin/products/NO').flush({ code: 'not_found', message: 'No encontrado.' }, { status: 404, statusText: 'Not Found' });
    await expect(p).rejects.toMatchObject({ message: 'No encontrado.' });
  });
});
