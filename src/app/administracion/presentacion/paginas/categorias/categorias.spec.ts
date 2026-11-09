import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { AdminCategorias } from './categorias';

const cat = (slug: string, name: string, extra = {}) => ({ slug, name, headline: null, intro_html: null, sort_order: 1, is_active: true, seo_title: null, seo_description: null, products_count: 0, subcategories_count: 0, updated_at: 'x', ...extra });

const esperar = () => new Promise<void>(r => setTimeout(r));

describe('AdminCategorias', () => {
  let ctrl: HttpTestingController;

  async function montar(lista = [cat('amor', 'Amor', { products_count: 2 }), cat('familia', 'Familia')]) {
    TestBed.configureTestingModule({ imports: [AdminCategorias], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    ctrl = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminCategorias);
    fixture.detectChanges();
    ctrl.expectOne('/api/v1/admin/categories').flush({ data: lista });
    await esperar();
    fixture.detectChanges();
    return fixture;
  }

  it('muestra las categorías que vienen de la API con sus conteos', async () => {
    const fixture = await montar();
    const texto = fixture.nativeElement.textContent;

    expect(texto).toContain('Amor');
    expect(texto).toContain('/amor · 2 producto(s)');
    expect(texto).toContain('Familia');
  });

  it('al eliminar una categoría con productos muestra el mensaje y la lista, y no la quita', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    c.pedirEliminar('amor');
    const p = c.eliminar('amor');

    ctrl.expectOne('/api/v1/admin/categories/amor').flush(
      { code: 'category_has_products', message: "No se puede eliminar la categoría 'amor' porque tiene 2 producto(s). Muévelos a otra categoría o elimínalos primero.", products_count: 2, products: [{ sku: 'A-1', slug: 'a', name: 'Pareja uno' }, { sku: 'A-2', slug: 'b', name: 'Pareja dos' }] },
      { status: 409, statusText: 'Conflict' },
    );
    await p;
    fixture.detectChanges();

    const texto = fixture.nativeElement.querySelector('[role=alert]').textContent;
    expect(texto).toContain('No se puede eliminar la categoría');
    expect(texto).toContain('Pareja uno');
    expect(texto).toContain('Pareja dos');
    expect(c.categorias().length).toBe(2); // sin recargar: nada se borró
  });

  it('eliminar una categoría vacía la borra y recarga la lista', async () => {
    const fixture = await montar();
    const p = fixture.componentInstance.eliminar('familia');
    const del = ctrl.expectOne('/api/v1/admin/categories/familia');
    expect(del.request.method).toBe('DELETE');
    del.flush(null, { status: 204, statusText: 'No Content' });
    await esperar();
    ctrl.expectOne('/api/v1/admin/categories').flush({ data: [cat('amor', 'Amor')] });
    await p;

    expect(fixture.componentInstance.categorias().map(c => c.slug)).toEqual(['amor']);
    expect(fixture.componentInstance.aviso()).toBe('Categoría eliminada.');
  });

  it('crear: envía los datos, y si Laravel rechaza muestra sus mensajes en español', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    c.nueva();
    c.form.name = 'Nombre que Laravel rechaza';
    const p = c.guardar(new Event('submit'));

    ctrl.expectOne('/api/v1/admin/categories').flush(
      { code: 'validation_error', message: 'Revisa los datos ingresados.', errors: { name: ['Escribe el nombre de la categoría.'] } },
      { status: 422, statusText: 'Unprocessable' },
    );
    await p;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Escribe el nombre de la categoría.');
    expect(c.editando()).toBe(''); // el formulario sigue abierto
  });

  it('crear con éxito cierra el formulario y recarga', async () => {
    const fixture = await montar([]);
    const c = fixture.componentInstance;
    c.nueva();
    c.form.name = 'Día de la Madre';
    const p = c.guardar(new Event('submit'));

    const post = ctrl.expectOne('/api/v1/admin/categories');
    expect(post.request.body).toMatchObject({ name: 'Día de la Madre', headline: null, is_active: true });
    expect('slug' in post.request.body).toBe(false); // el slug no se envía: Laravel lo genera del nombre
    post.flush(cat('dia-de-la-madre', 'Día de la Madre'), { status: 201, statusText: 'Created' });
    await esperar();
    ctrl.expectOne('/api/v1/admin/categories').flush({ data: [cat('dia-de-la-madre', 'Día de la Madre')] });
    await p;

    expect(c.editando()).toBeNull();
    expect(c.aviso()).toBe('Categoría creada.');
  });

  it('al crear muestra la dirección generada del nombre (guion por espacio) y no es editable', async () => {
    const fixture = await montar([]);
    const c = fixture.componentInstance;
    c.nueva();
    c.form.name = 'Día de la Madre';
    fixture.detectChanges();

    const campo = fixture.nativeElement.querySelector('#slug') as HTMLInputElement;
    expect(c.slugMostrado()).toBe('dia-de-la-madre');
    expect(campo.value).toBe('/dia-de-la-madre');
    expect(campo.readOnly).toBe(true);
  });

  it('al editar muestra la dirección guardada aunque se cambie el nombre', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    c.editar(c.categorias()[0]);
    c.form.name = 'Otro nombre distinto';
    fixture.detectChanges();

    expect(c.slugMostrado()).toBe('amor');
    expect((fixture.nativeElement.querySelector('#slug') as HTMLInputElement).value).toBe('/amor');
  });

  it('los campos de Google son opcionales: vacíos se envían como null', async () => {
    const fixture = await montar([]);
    const c = fixture.componentInstance;
    c.nueva();
    c.form.name = 'Amor';
    const p = c.guardar(new Event('submit'));
    const post = ctrl.expectOne('/api/v1/admin/categories');
    expect(post.request.body).toMatchObject({ intro_html: null, seo_title: null, seo_description: null });
    post.flush(cat('amor', 'Amor'), { status: 201, statusText: 'Created' });
    await esperar();
    ctrl.expectOne('/api/v1/admin/categories').flush({ data: [] });
    await p;
  });

  it('al editar carga los campos de Google guardados y al guardar los envía', async () => {
    const fixture = await montar([cat('amor', 'Amor', { seo_title: 'Regalos de amor', seo_description: 'Macetas con nombre', intro_html: 'Un regalo que crece' })]);
    const c = fixture.componentInstance;
    c.editar(c.categorias()[0]);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect((el.querySelector('#seo_title') as HTMLInputElement).value).toBe('Regalos de amor');
    expect((el.querySelector('#seo_description') as HTMLTextAreaElement).value).toBe('Macetas con nombre');
    expect((el.querySelector('#intro') as HTMLTextAreaElement).value).toBe('Un regalo que crece');

    c.form.seo_title = '  Amor | Jardín  ';
    const p = c.guardar(new Event('submit'));
    const put = ctrl.expectOne('/api/v1/admin/categories/amor');
    expect(put.request.body).toMatchObject({ seo_title: 'Amor | Jardín', seo_description: 'Macetas con nombre', intro_html: 'Un regalo que crece' });
    put.flush(cat('amor', 'Amor'));
    await esperar();
    ctrl.expectOne('/api/v1/admin/categories').flush({ data: [] });
    await p;
  });

  it('si el título de Google está vacío muestra cuál se usará: "Nombre | Jardín de Sele"', async () => {
    const fixture = await montar([]);
    const c = fixture.componentInstance;
    c.nueva();
    c.form.name = 'Amistad';
    expect(c.tituloVistaPrevia()).toBe('Amistad | Jardín de Sele');
    c.form.seo_title = 'Regalos de amistad';
    expect(c.tituloVistaPrevia()).toBe('Regalos de amistad');
  });

  it('sin nombre o con posición inválida avisa, marca los campos y no llama a la API', async () => {
    const fixture = await montar();
    const avisos = TestBed.inject(AvisosService);
    const c = fixture.componentInstance;
    c.nueva();
    c.form.name = '  ';
    c.form.sort_order = -3;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-invalid=true]')).toBeNull(); // antes de pulsar Guardar no se marca nada

    c.guardar(new Event('submit'));
    fixture.detectChanges();

    ctrl.expectNone('/api/v1/admin/categories');
    expect(avisos.lista().at(-1)?.texto).toContain('Faltan datos o hay datos incorrectos');
    expect(fixture.nativeElement.querySelector('#name').getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('Escribe el nombre de la categoría.');
    expect(fixture.nativeElement.textContent).toContain('número entero');
    expect(c.guardando()).toBe(false);
  });
});
