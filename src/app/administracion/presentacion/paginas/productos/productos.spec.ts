import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { AdminProductos } from './productos';

const prod = (sku: string, name: string, extra = {}) => ({ sku, slug: name.toLowerCase(), name, category_name: 'Profesiones', base_price_cents: 2150, discount_percent: 0, discount_cents: 0, final_price_cents: 2150, subcategory_slug: null, is_active: true, is_available: true, ...extra });
const esperar = () => new Promise<void>(r => setTimeout(r));

describe('AdminProductos', () => {
  let ctrl: HttpTestingController;

  async function montar() {
    TestBed.configureTestingModule({
      imports: [AdminProductos],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }],
    });
    ctrl = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminProductos);
    fixture.detectChanges();
    ctrl.expectOne('/api/v1/admin/categories').flush({ data: [] });
    ctrl.expectOne(r => r.url === '/api/v1/admin/products').flush({ data: [prod('D-1', 'Doctor'), prod('E-1', 'Enfermera', { is_available: false })] });
    await esperar();
    fixture.detectChanges();
    return fixture;
  }

  it('muestra los productos con su precio en dólares y el estado', async () => {
    const texto = (await montar()).nativeElement.textContent;
    expect(texto).toContain('Doctor');
    expect(texto).toContain('$21.50');
    expect(texto).toContain('Agotado');
  });

  it('muestra el precio con descuento y el original tachado', async () => {
    TestBed.configureTestingModule({
      imports: [AdminProductos],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }],
    });
    const c2 = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminProductos);
    fixture.detectChanges();
    c2.expectOne('/api/v1/admin/categories').flush({ data: [] });
    c2.expectOne(r => r.url === '/api/v1/admin/products').flush({ data: [prod('D-1', 'Doctor', { discount_percent: 10, discount_cents: 215, final_price_cents: 1935 })] });
    await esperar();
    fixture.detectChanges();
    const texto = (fixture.nativeElement as HTMLElement).textContent!;
    expect(texto).toContain('$19.35');
    expect(texto).toContain('$21.50');
    expect(texto).toContain('−10%');
  });

  it('eliminar pide confirmación, llama a la API y recarga', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    c.pedirEliminar('D-1');
    expect(c.porEliminar()).toBe('D-1');

    const p = c.eliminar('D-1');
    const del = ctrl.expectOne('/api/v1/admin/products/D-1');
    expect(del.request.method).toBe('DELETE');
    del.flush(null, { status: 204, statusText: 'No Content' });
    await esperar();
    ctrl.expectOne(r => r.url === '/api/v1/admin/products').flush({ data: [prod('E-1', 'Enfermera')] });
    await p;

    expect(c.aviso()).toBe('Producto eliminado.');
    expect(c.productos().length).toBe(1);
  });
});
