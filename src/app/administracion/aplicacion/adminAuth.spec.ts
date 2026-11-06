import { API_URL } from '../../core/configuracion/api';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { adminAuthInterceptor, adminGuard } from './adminAuth';
import { SesionAdminService } from './servicios/SesionAdminService';

const SESION = { token: 'tok', expires_at: new Date(Date.now() + 3600_000).toISOString(), user: { name: 'Sele', email: 's@s.com' } };

describe('Autenticación del panel', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([adminAuthInterceptor])), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });
  afterEach(() => ctrl.verify());

  const entrar = () => localStorage.setItem('jds_admin_sesion', JSON.stringify(SESION));

  it('envía el token Bearer a las rutas /admin/* pero no a la API pública ni al login', () => {
    entrar();
    http.get('/api/v1/admin/me').subscribe();
    expect(ctrl.expectOne('/api/v1/admin/me').request.headers.get('Authorization')).toBe('Bearer tok');

    http.get('/api/v1/categories').subscribe();
    expect(ctrl.expectOne('/api/v1/categories').request.headers.has('Authorization')).toBe(false);

    http.post('/api/v1/admin/login', {}).subscribe();
    expect(ctrl.expectOne('/api/v1/admin/login').request.headers.has('Authorization')).toBe(false);
  });

  it('ante un 401 olvida la sesión y manda al login con la pantalla de regreso', async () => {
    entrar();
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    http.get('/api/v1/admin/me').subscribe({ error: () => {} });
    ctrl.expectOne('/api/v1/admin/me').flush({ code: 'unauthenticated', message: 'x' }, { status: 401, statusText: 'Unauthorized' });

    expect(TestBed.inject(SesionAdminService).estaAutenticado()).toBe(false);
    expect(navegar).toHaveBeenCalledWith(['/admin/login'], { queryParams: { returnUrl: expect.any(String) } });
  });

  it('la guarda deja pasar con sesión y sin ella redirige al login con returnUrl', () => {
    const estado = { url: '/admin/pedidos/5' } as never;
    const sinSesion = TestBed.runInInjectionContext(() => adminGuard({} as never, estado));
    expect(router.serializeUrl(sinSesion as never)).toBe('/admin/login?returnUrl=%2Fadmin%2Fpedidos%2F5');

    TestBed.inject(SesionAdminService).olvidar();
    entrar();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    expect(TestBed.runInInjectionContext(() => adminGuard({} as never, estado))).toBe(true);
  });
});
