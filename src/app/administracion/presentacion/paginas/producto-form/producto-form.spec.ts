import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { AdminProductoForm } from './producto-form';

const esperar = () => new Promise<void>(r => setTimeout(r));
const CAT = { slug: 'profesiones-y-hobbies', name: 'Profesiones' };

describe('AdminProductoForm', () => {
  let ctrl: HttpTestingController;

  async function montar(sku: string | null, producto?: object) {
    TestBed.configureTestingModule({
      imports: [AdminProductoForm],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => sku } } } },
      ],
    });
    ctrl = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminProductoForm);
    fixture.detectChanges();
    ctrl.expectOne('/api/v1/admin/categories').flush({ data: [CAT] });
    await esperar();
    if (sku) {
      ctrl.expectOne(`/api/v1/admin/products/${sku}`).flush(producto ?? {});
      await esperar();
      ctrl.expectOne(`/api/v1/admin/categories/${CAT.slug}/subcategories`).flush({ data: [{ slug: 'salud', name: 'Salud' }] });
      await esperar();
    }
    fixture.detectChanges();
    return fixture;
  }

  it('no llama a la API si faltan datos y muestra los errores', async () => {
    const fixture = await montar(null);
    const c = fixture.componentInstance;
    c.form.precio = 'abc';
    await c.guardar(new Event('submit'));

    expect(c.errores()['name']).toBeTruthy();
    expect(c.errores()['category']).toBeTruthy();
    expect(c.errores()['precio']).toBe('Escribe un precio válido, por ejemplo 21.50.');
    ctrl.verify();
  });

  it('crear envía centavos enteros, líneas de "incluye" y el SKU solo si se escribió', async () => {
    const fixture = await montar(null);
    const c = fixture.componentInstance;
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    Object.assign(c.form, { name: 'Doctor', category: CAT.slug, precio: '21.50', costo: '9', incluye: 'Maceta\n\n Planta ' });

    const p = c.guardar(new Event('submit'));
    const post = ctrl.expectOne('/api/v1/admin/products');
    expect(post.request.body).toMatchObject({ name: 'Doctor', base_price_cents: 2150, cost_cents: 900, includes: ['Maceta', 'Planta'], subcategory: null });
    expect('sku' in post.request.body).toBe(false);
    post.flush({}, { status: 201, statusText: 'Created' });
    await p;
    expect(navegar).toHaveBeenCalledWith(['/admin/productos']);
  });

  it('editar carga el producto, muestra el precio en dólares y no envía el SKU', async () => {
    const fixture = await montar('JDS-1', {
      sku: 'JDS-1', slug: 'doctor', name: 'Doctor', type: 'personalizable', category_slug: CAT.slug, subcategory_slug: 'salud',
      base_price_cents: 2150, cost_cents: null, size_text: null, material_text: null, includes: ['Maceta'], description_html: null,
      is_available: true, is_active: true,
    });
    const c = fixture.componentInstance;
    expect(c.form.precio).toBe('21.50');
    expect(c.form.incluye).toBe('Maceta');
    expect(c.slugMostrado()).toBe('doctor');

    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    c.form.name = 'Doctor nuevo';
    const p = c.guardar(new Event('submit'));
    const put = ctrl.expectOne('/api/v1/admin/products/JDS-1');
    expect(put.request.method).toBe('PUT');
    expect('sku' in put.request.body).toBe(false);
    expect('slug' in put.request.body).toBe(false);
    put.flush({});
    await p;
    expect(navegar).toHaveBeenCalled();
  });

  it('muestra los errores de validación de Laravel', async () => {
    const fixture = await montar(null);
    const c = fixture.componentInstance;
    Object.assign(c.form, { name: 'Doctor', category: CAT.slug, precio: '10' });
    const p = c.guardar(new Event('submit'));
    ctrl.expectOne('/api/v1/admin/products').flush(
      { code: 'validation_error', message: 'Revisa los datos.', errors: { sku: ['Ese código ya existe.'] } },
      { status: 422, statusText: 'Unprocessable' },
    );
    await p;
    expect(c.error()).toBe('Revisa los datos.');
    expect(c.detalle()).toEqual(['Ese código ya existe.']);
  });
});
