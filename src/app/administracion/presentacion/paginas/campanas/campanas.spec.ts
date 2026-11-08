import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { AdminCampanas, aFechaAnual, leerFechaAnual, textoFechaAnual } from './campanas';

const esperar = () => new Promise<void>(r => setTimeout(r));

const campana = (extra = {}) => ({
  slug: 'san-valentin', name: 'San Valentín', related_category: { slug: 'amor', name: 'Amor' },
  start_md: '01-15', end_md: '02-14', event_md: '02-14', tagline: null, slogan: null, is_active: true,
  seo_title: null, seo_description: null, products: [{ sku: 'A-2', slug: 'b', name: 'Dos' }], state: 'upcoming', season_year: 2027, updated_at: 'x', ...extra,
});
const cat = (slug: string, name: string) => ({ slug, name });
const prod = (sku: string, name: string) => ({ sku, slug: sku.toLowerCase(), name, is_active: true });

describe('fechas anuales', () => {
  it('convierte entre "MM-DD" y día/mes', () => {
    expect(leerFechaAnual('05-10')).toEqual({ dia: 10, mes: 5 });
    expect(aFechaAnual({ dia: 4, mes: 2 })).toBe('02-04');
    expect(textoFechaAnual('02-14')).toBe('14 de febrero');
  });
});

describe('AdminCampanas', () => {
  let ctrl: HttpTestingController;

  async function montar() {
    TestBed.configureTestingModule({ imports: [AdminCampanas], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    ctrl = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminCampanas);
    fixture.detectChanges();
    ctrl.expectOne('/api/v1/admin/campaigns').flush({ data: [campana()] });
    ctrl.expectOne('/api/v1/admin/categories').flush({ data: [cat('amor', 'Amor')] });
    ctrl.expectOne(r => r.url === '/api/v1/admin/products').flush({ data: [prod('A-1', 'Uno'), prod('A-2', 'Dos')] });
    await esperar();
    fixture.detectChanges();
    return fixture;
  }

  it('lista las campañas con su estado de temporada calculado por Laravel', async () => {
    const texto = (await montar()).nativeElement.textContent;
    expect(texto).toContain('San Valentín');
    expect(texto).toContain('15 de enero al 14 de febrero');
    expect(texto).toContain('llega en 2027');
  });

  it('crea una campaña enviando fechas MM-DD y los productos en el orden elegido, sin slug', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    c.nueva();
    c.form.name = 'Día de la Madre';
    c.form.related_category = 'amor';
    c.form.inicio = { dia: 1, mes: 5 };
    c.form.fin = { dia: 10, mes: 5 };
    c.form.evento = { dia: 10, mes: 5 };
    c.alternar('A-1');
    c.alternar('A-2');
    c.mover('A-2', -1);
    const p = c.guardar(new Event('submit'));

    const req = ctrl.expectOne('/api/v1/admin/campaigns');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.start_md).toBe('05-01');
    expect(req.request.body.end_md).toBe('05-10');
    expect(req.request.body.products).toEqual(['A-2', 'A-1']);
    expect(req.request.body.slug).toBeUndefined();
    req.flush(campana({ slug: 'dia-de-la-madre' }), { status: 201, statusText: 'Created' });
    await esperar();
    ctrl.expectOne('/api/v1/admin/campaigns').flush({ data: [] });
    ctrl.expectOne('/api/v1/admin/categories').flush({ data: [] });
    ctrl.expectOne(r => r.url === '/api/v1/admin/products').flush({ data: [] });
    await p;
    expect(c.editando()).toBeNull();
  });

  it('muestra los errores de validación de Laravel y mantiene el formulario abierto', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    c.editar(c.campanas()[0]);
    const p = c.guardar(new Event('submit'));
    const req = ctrl.expectOne('/api/v1/admin/campaigns/san-valentin');
    expect(req.request.method).toBe('PUT');
    req.flush({ code: 'validation_error', message: 'Datos no válidos.', errors: { name: ['Escribe el nombre.'] } }, { status: 422, statusText: 'Unprocessable' });
    await p;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('Escribe el nombre.');
    expect(c.editando()).toBe('san-valentin');
  });
});
