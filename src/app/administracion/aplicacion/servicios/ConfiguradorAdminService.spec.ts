import { firstValueFrom } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../core/configuracion/api';
import { ConfigGuardableAdmin } from '../../dominio/interfaces/configurador-admin';
import { ConfiguradorAdminService } from './ConfiguradorAdminService';

const VACIA: ConfigGuardableAdmin = { locations: [], accessory_ids: [], exceptions: [] };

describe('ConfiguradorAdminService', () => {
  let s: ConfiguradorAdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    s = TestBed.inject(ConfiguradorAdminService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('lista accesorios, categorías y ubicaciones que devuelve Laravel', async () => {
    const a = firstValueFrom(s.accesorios());
    http.expectOne('/api/v1/admin/accessories').flush({ data: [{ id: 1 }] });
    expect(await a).toEqual([{ id: 1 }] as never);

    const c = firstValueFrom(s.categoriasDeAccesorios());
    http.expectOne('/api/v1/admin/accessory-categories').flush({ data: [{ id: 2 }] });
    expect(await c).toEqual([{ id: 2 }] as never);

    const u = firstValueFrom(s.ubicaciones());
    http.expectOne('/api/v1/admin/locations').flush({ data: [{ id: 3 }] });
    expect(await u).toEqual([{ id: 3 }] as never);
  });

  it('sube la imagen del accesorio como multipart con su texto alternativo', async () => {
    const p = firstValueFrom(s.subirImagenDeAccesorio(5, new File(['x'], 'gafas.png', { type: 'image/png' }), '  Gafas negras '));
    const r = http.expectOne('/api/v1/admin/accessories/5/image');
    expect(r.request.method).toBe('POST');
    const cuerpo = r.request.body as FormData;
    expect((cuerpo.get('image') as File).name).toBe('gafas.png');
    expect(cuerpo.get('alt')).toBe('Gafas negras');
    r.flush({ id: 5 });
    await p;
  });

  it('lee y guarda la configuración de una categoría y de un producto', async () => {
    const a = firstValueFrom(s.deCategoria('profesiones y hobbies'));
    http.expectOne('/api/v1/admin/configurator/categories/profesiones%20y%20hobbies').flush({ scope: 'category' });
    await a;

    const b = firstValueFrom(s.guardarDeCategoria('amor', VACIA));
    const put = http.expectOne('/api/v1/admin/configurator/categories/amor');
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual(VACIA);
    put.flush({ scope: 'category' });
    await b;

    const c = firstValueFrom(s.deProducto('PRO-DOCTOR'));
    http.expectOne('/api/v1/admin/configurator/products/PRO-DOCTOR').flush({ scope: 'product' });
    await c;

    const d = firstValueFrom(s.guardarDeProducto('PRO-DOCTOR', VACIA));
    const putP = http.expectOne('/api/v1/admin/configurator/products/PRO-DOCTOR');
    expect(putP.request.method).toBe('PUT');
    putP.flush({ scope: 'product' });
    await d;
  });

  it('cambia entre la configuración de la categoría y la propia del producto', async () => {
    const p = firstValueFrom(s.cambiarModo('PRO-DOCTOR', true, true));
    const r = http.expectOne('/api/v1/admin/configurator/products/PRO-DOCTOR/mode');
    expect(r.request.method).toBe('PUT');
    expect(r.request.body).toEqual({ uses_own_configurator: true, copy_from_category: true });
    r.flush({ scope: 'product' });
    await p;
  });
});
