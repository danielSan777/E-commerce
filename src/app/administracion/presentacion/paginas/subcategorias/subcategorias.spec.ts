import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { AdminSubcategorias } from './subcategorias';

const BASE = '/api/v1/admin/categories/profesiones-y-hobbies/subcategories';
const sub = (slug: string, name: string, extra = {}) => ({ slug, name, category_slug: 'profesiones-y-hobbies', sort_order: 1, is_active: true, products_count: 0, ...extra });
const esperar = () => new Promise<void>(r => setTimeout(r));

describe('AdminSubcategorias', () => {
  let ctrl: HttpTestingController;

  async function montar(lista = [sub('salud', 'Salud', { products_count: 2 }), sub('cocina', 'Cocina')]) {
    TestBed.configureTestingModule({
      imports: [AdminSubcategorias],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'profesiones-y-hobbies' } } } },
      ],
    });
    ctrl = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminSubcategorias);
    fixture.detectChanges();
    ctrl.expectOne(BASE).flush({ data: lista });
    await esperar();
    fixture.detectChanges();
    return fixture;
  }

  it('muestra las subcategorías de la categoría con la dirección completa', async () => {
    const fixture = await montar();
    const texto = fixture.nativeElement.textContent;

    expect(texto).toContain('/profesiones-y-hobbies/salud · 2 producto(s)');
    expect(texto).toContain('Cocina');
  });

  it('eliminar con productos muestra el mensaje y la lista y no la quita', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    const p = c.eliminar('salud');

    ctrl.expectOne(`${BASE}/salud`).flush(
      { code: 'subcategory_has_products', message: "No se puede eliminar la subcategoría 'salud' porque tiene 2 producto(s).", products_count: 2, products: [{ sku: 'D-1', slug: 'doctor', name: 'Doctor' }, { sku: 'E-1', slug: 'enfermera', name: 'Enfermera' }] },
      { status: 409, statusText: 'Conflict' },
    );
    await p;
    fixture.detectChanges();

    const texto = fixture.nativeElement.querySelector('[role=alert]').textContent;
    expect(texto).toContain('No se puede eliminar la subcategoría');
    expect(texto).toContain('Doctor');
    expect(texto).toContain('Enfermera');
    expect(c.lista().length).toBe(2);
  });

  it('crear no envía el slug y muestra la dirección generada del nombre', async () => {
    const fixture = await montar([]);
    const c = fixture.componentInstance;
    c.nueva();
    c.form.name = 'Fuerza Pública';
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('#slug') as HTMLInputElement).value).toBe('/profesiones-y-hobbies/fuerza-publica');

    const p = c.guardar(new Event('submit'));
    const post = ctrl.expectOne(BASE);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toMatchObject({ name: 'Fuerza Pública', is_active: true });
    expect('slug' in post.request.body).toBe(false);
    post.flush(sub('fuerza-publica', 'Fuerza Pública'), { status: 201, statusText: 'Created' });
    await esperar();
    ctrl.expectOne(BASE).flush({ data: [sub('fuerza-publica', 'Fuerza Pública')] });
    await p;

    expect(c.aviso()).toBe('Subcategoría creada.');
    expect(c.editando()).toBeNull();
  });

  it('muestra los errores de validación de Laravel en español', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    c.nueva();
    c.form.name = 'Salud';
    const p = c.guardar(new Event('submit'));

    ctrl.expectOne(BASE).flush(
      { code: 'validation_error', message: 'Revisa los datos ingresados.', errors: { slug: ['Ya existe una subcategoría con un nombre igual o muy parecido en esta categoría.'] } },
      { status: 422, statusText: 'Unprocessable' },
    );
    await p;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ya existe una subcategoría con un nombre igual o muy parecido');
    expect(c.editando()).toBe('');
  });
});
