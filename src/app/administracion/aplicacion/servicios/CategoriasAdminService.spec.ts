import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../core/configuracion/api';
import { CategoriasAdminService } from './CategoriasAdminService';

const CAT = { slug: 'amor', name: 'Amor', headline: null, intro_html: null, sort_order: 1, is_active: true, seo_title: null, seo_description: null, products_count: 2, subcategories_count: 0, updated_at: '2026-11-07T10:00:00-05:00' };

describe('CategoriasAdminService', () => {
  let s: CategoriasAdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    s = TestBed.inject(CategoriasAdminService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('lista las categorías que devuelve Laravel', async () => {
    const p = s.listar();
    http.expectOne('/api/v1/admin/categories').flush({ data: [CAT] });
    expect(await p).toEqual([CAT]);
  });

  it('crea con POST y edita con PUT sin enviar el slug', async () => {
    const a = s.crear({ name: 'Nueva', headline: null, sort_order: 1, is_active: true });
    const post = http.expectOne('/api/v1/admin/categories');
    expect(post.request.method).toBe('POST');
    post.flush({ ...CAT, slug: 'nueva' }, { status: 201, statusText: 'Created' });
    await a;

    const b = s.editar('amor', { name: 'Amor y pareja', headline: null, sort_order: 1, is_active: false });
    const put = http.expectOne('/api/v1/admin/categories/amor');
    expect(put.request.method).toBe('PUT');
    expect('slug' in put.request.body).toBe(false);
    put.flush(CAT);
    await b;
  });

  it('eliminar con productos: lanza el 409 con el mensaje y la lista de productos', async () => {
    const p = s.eliminar('familia');
    http.expectOne('/api/v1/admin/categories/familia').flush(
      { code: 'category_has_products', message: "No se puede eliminar la categoría 'familia' porque tiene 1 producto(s).", products_count: 1, products: [{ sku: 'HOM-1', slug: 'homero', name: 'Homero' }] },
      { status: 409, statusText: 'Conflict' },
    );

    await expect(p).rejects.toMatchObject({ status: 409, code: 'category_has_products', products_count: 1, products: [{ sku: 'HOM-1', slug: 'homero', name: 'Homero' }] });
  });
});
