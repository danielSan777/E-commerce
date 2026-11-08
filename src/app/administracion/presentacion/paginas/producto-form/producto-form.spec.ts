import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { AdminProductoForm, leerDescuento } from './producto-form';

const esperar = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));
const CAT = { slug: 'profesiones-y-hobbies', name: 'Profesiones' };
const SUB = { slug: 'salud', name: 'Salud' };

describe('leerDescuento', () => {
  it('acepta vacío (0), enteros y hasta dos decimales con punto o coma, de 0 a 90', () => {
    expect(leerDescuento('')).toBe(0);
    expect(leerDescuento(' 10 ')).toBe(10);
    expect(leerDescuento('12.5')).toBe(12.5);
    expect(leerDescuento('12,25')).toBe(12.25);
    expect(leerDescuento('90')).toBe(90);
  });

  it('rechaza lo que no es válido', () => {
    for (const malo of ['abc', '-5', '91', '100', '10.123', '1e2', '10%']) expect(leerDescuento(malo)).toBeNull();
  });
});

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
      ctrl.expectOne(`/api/v1/admin/categories/${CAT.slug}/subcategories`).flush({ data: [SUB] });
      await esperar();
    } else {
      ctrl.expectOne('/api/v1/admin/products/next-sku').flush({ sku: 'JDS-004' });
      await esperar();
    }
    fixture.detectChanges();
    return fixture;
  }

  /** Elige la categoría como lo haría la persona y responde la lista de subcategorías. */
  async function elegirCategoria(fixture: Awaited<ReturnType<typeof montar>>, subcategorias: object[] = [SUB]) {
    const c = fixture.componentInstance;
    c.form.category = CAT.slug;
    const p = c.cambiarCategoria();
    ctrl.expectOne(`/api/v1/admin/categories/${CAT.slug}/subcategories`).flush({ data: subcategorias });
    await p;
    fixture.detectChanges();
  }

  it('mientras cargan las subcategorías el campo queda bloqueado y dice "Cargando…"', async () => {
    const fixture = await montar(null);
    const c = fixture.componentInstance;
    const el = fixture.nativeElement as HTMLElement;
    c.form.category = CAT.slug;
    const p = c.cambiarCategoria();
    fixture.detectChanges();
    await fixture.whenStable();
    const select = el.querySelector<HTMLSelectElement>('#subcategory')!;
    expect(select.disabled).toBe(true);
    expect(select.options[0].textContent).toContain('Cargando…');
    ctrl.expectOne(`/api/v1/admin/categories/${CAT.slug}/subcategories`).flush({ data: [SUB] });
    await p;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(select.disabled).toBe(false);
    expect(select.options[0].textContent).toContain('Elige una subcategoría');
    expect(select.options.length).toBe(2);
  });

  it('muestra el código siguiente en solo lectura: no se puede escribir', async () => {
    const fixture = await montar(null);
    const campo = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#sku')!;
    expect(campo.readOnly).toBe(true);
    expect(campo.value).toBe('JDS-004');
    expect(fixture.nativeElement.textContent).toContain('el siguiente es JDS-004');
  });

  it('no llama a la API si faltan datos y muestra los errores (subcategoría incluida)', async () => {
    const fixture = await montar(null);
    const c = fixture.componentInstance;
    c.form.precio = 'abc';
    c.form.descuento = '95';
    await c.guardar(new Event('submit'));

    expect(c.errores()['name']).toBeTruthy();
    expect(c.errores()['category']).toBeTruthy();
    expect(c.errores()['subcategory']).toBe('Elige la subcategoría.');
    expect(c.errores()['precio']).toBe('Escribe un precio válido, por ejemplo 21.50.');
    expect(c.errores()['descuento']).toContain('entre 0 y 90');
    ctrl.verify();
  });

  it('el aviso de un campo desaparece cuando la persona lo corrige', async () => {
    const fixture = await montar(null);
    const c = fixture.componentInstance;
    await c.guardar(new Event('submit'));
    expect(Object.keys(c.errores()).sort()).toEqual(['category', 'name', 'precio', 'subcategory']);
    c.quitarError('name');
    c.quitarError('precio');
    expect(Object.keys(c.errores()).sort()).toEqual(['category', 'subcategory']);
  });

  it('la subcategoría es obligatoria aunque la categoría esté elegida', async () => {
    const fixture = await montar(null);
    await elegirCategoria(fixture);
    const c = fixture.componentInstance;
    Object.assign(c.form, { name: 'Doctor', precio: '10' });
    await c.guardar(new Event('submit'));
    expect(c.errores()['subcategory']).toBe('Elige la subcategoría.');
    ctrl.verify();
  });

  it('una categoría sin subcategorías avisa y ofrece crearlas, y no deja guardar', async () => {
    const fixture = await montar(null);
    await elegirCategoria(fixture, []);
    const c = fixture.componentInstance;
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Esta categoría todavía no tiene subcategorías.');
    expect(html.querySelector<HTMLAnchorElement>('a[href$="/subcategorias"]')).not.toBeNull();
    expect(html.querySelector<HTMLSelectElement>('#subcategory')!.disabled).toBe(true);

    Object.assign(c.form, { name: 'Doctor', precio: '10' });
    await c.guardar(new Event('submit'));
    expect(c.errores()['subcategory']).toBe('Esta categoría todavía no tiene subcategorías. Crea una primero.');
    ctrl.verify();
  });

  it('crear envía centavos enteros, subcategoría, descuento y nunca un SKU', async () => {
    const fixture = await montar(null);
    await elegirCategoria(fixture);
    const c = fixture.componentInstance;
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    Object.assign(c.form, { name: 'Doctor', subcategory: 'salud', precio: '21.50', costo: '9', descuento: '12,5', incluye: 'Maceta\n\n Planta ' });

    const p = c.guardar(new Event('submit'));
    const post = ctrl.expectOne('/api/v1/admin/products');
    expect(post.request.body).toMatchObject({ name: 'Doctor', category: CAT.slug, subcategory: 'salud', base_price_cents: 2150, cost_cents: 900, discount_percent: 12.5, includes: ['Maceta', 'Planta'] });
    expect('sku' in post.request.body).toBe(false);
    post.flush({ sku: 'JDS-004' }, { status: 201, statusText: 'Created' });
    await p;
    expect(navegar).toHaveBeenCalledWith(['/admin/productos']);
  });

  it('sin descuento escrito envía 0', async () => {
    const fixture = await montar(null);
    await elegirCategoria(fixture);
    const c = fixture.componentInstance;
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    Object.assign(c.form, { name: 'Doctor', subcategory: 'salud', precio: '10' });
    const p = c.guardar(new Event('submit'));
    const post = ctrl.expectOne('/api/v1/admin/products');
    expect(post.request.body.discount_percent).toBe(0);
    post.flush({ sku: 'JDS-004' }, { status: 201, statusText: 'Created' });
    await p;
  });

  it('muestra el descuento en dólares y el precio final que calcula Laravel', async () => {
    const fixture = await montar(null);
    const c = fixture.componentInstance;
    c.form.precio = '21.50';
    c.form.descuento = '10';
    c.verPrecio();
    await esperar(350);
    const req = ctrl.expectOne(r => r.url === '/api/v1/admin/products/price-preview');
    expect(req.request.params.get('base_price_cents')).toBe('2150');
    expect(req.request.params.get('discount_percent')).toBe('10');
    req.flush({ base_price_cents: 2150, discount_percent: 10, discount_cents: 215, final_price_cents: 1935 });
    await esperar();
    fixture.detectChanges();

    expect(c.precioFinal()?.discount_cents).toBe(215);
    const texto = (fixture.nativeElement as HTMLElement).querySelector('.calculo')!.textContent!;
    expect(texto).toContain('Descuento: $2.15');
    expect(texto).toContain('Precio final: $19.35');
  });

  it('no consulta el precio si no hay descuento o los datos no son válidos, y borra el cálculo anterior', async () => {
    const fixture = await montar(null);
    const c = fixture.componentInstance;
    c.form.precio = 'abc';
    c.form.descuento = '10';
    c.verPrecio();
    c.form.precio = '10';
    c.form.descuento = '';
    c.verPrecio();
    await esperar(350);
    ctrl.expectNone(r => r.url.endsWith('/price-preview'));
    expect(c.precioFinal()).toBeNull();
  });

  it('editar muestra el código real, el descuento guardado y no envía SKU ni slug', async () => {
    const fixture = await montar('JDS-001', {
      sku: 'JDS-001', slug: 'doctor', name: 'Doctor', type: 'personalizable', category_slug: CAT.slug, subcategory_slug: 'salud',
      base_price_cents: 2150, cost_cents: null, discount_percent: 10, discount_cents: 215, final_price_cents: 1935,
      size_text: null, material_text: null, includes: ['Maceta'], description_html: null, is_available: true, is_active: true,
    });
    const c = fixture.componentInstance;
    expect(c.form.precio).toBe('21.50');
    expect(c.form.descuento).toBe('10');
    expect(c.skuMostrado()).toBe('JDS-001');
    expect(c.slugMostrado()).toBe('doctor');
    await esperar(350);
    ctrl.expectOne(r => r.url.endsWith('/price-preview')).flush({ base_price_cents: 2150, discount_percent: 10, discount_cents: 215, final_price_cents: 1935 });

    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    c.form.name = 'Doctor nuevo';
    const p = c.guardar(new Event('submit'));
    const put = ctrl.expectOne('/api/v1/admin/products/JDS-001');
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toMatchObject({ subcategory: 'salud', discount_percent: 10 });
    expect('sku' in put.request.body).toBe(false);
    expect('slug' in put.request.body).toBe(false);
    put.flush({});
    await p;
  });

  it('muestra los errores de validación de Laravel', async () => {
    const fixture = await montar(null);
    await elegirCategoria(fixture);
    const c = fixture.componentInstance;
    Object.assign(c.form, { name: 'Doctor', subcategory: 'salud', precio: '10' });
    const p = c.guardar(new Event('submit'));
    ctrl.expectOne('/api/v1/admin/products').flush(
      { code: 'validation_error', message: 'Revisa los datos.', errors: { name: ['Ya existe un producto con un nombre igual.'] } },
      { status: 422, statusText: 'Unprocessable' },
    );
    await p;
    expect(c.error()).toBe('Revisa los datos.');
    expect(c.detalle()).toEqual(['Ya existe un producto con un nombre igual.']);
  });
});
