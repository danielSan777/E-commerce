import { API_URL } from '../../core/configuracion/api';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { sesionInterceptor, adminGuard, sesionGuard } from './adminAuth';
import { SesionService } from '../../cuenta/aplicacion/servicios/SesionService';

const SESION = { token: 'tok', expires_at: new Date(Date.now() + 3600_000).toISOString(), user: { name: 'Sele', email: 's@s.com', role: 'admin' as const } };

describe('Autenticación del panel', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([sesionInterceptor])), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });
  afterEach(() => ctrl.verify());

  const entrar = () => localStorage.setItem('jds_sesion', JSON.stringify(SESION));

  it('envía el token Bearer a las rutas /admin/* pero no a la API pública ni al login', () => {
    entrar();
    http.get('/api/v1/admin/me').subscribe();
    expect(ctrl.expectOne('/api/v1/admin/me').request.headers.get('Authorization')).toBe('Bearer tok');

    http.get('/api/v1/categories').subscribe();
    expect(ctrl.expectOne('/api/v1/categories').request.headers.has('Authorization')).toBe(false);

    http.get('/api/v1/auth/me').subscribe();
    expect(ctrl.expectOne('/api/v1/auth/me').request.headers.get('Authorization')).toBe('Bearer tok');

    http.post('/api/v1/auth/login', {}).subscribe();
    expect(ctrl.expectOne('/api/v1/auth/login').request.headers.has('Authorization')).toBe(false);
    http.post('/api/v1/auth/register', {}).subscribe();
    expect(ctrl.expectOne('/api/v1/auth/register').request.headers.has('Authorization')).toBe(false);
  });

  it('ante un 401 olvida la sesión y manda al login con la pantalla de regreso', async () => {
    entrar();
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    http.get('/api/v1/admin/me').subscribe({ error: () => {} });
    ctrl.expectOne('/api/v1/admin/me').flush({ code: 'unauthenticated', message: 'x' }, { status: 401, statusText: 'Unauthorized' });

    expect(TestBed.inject(SesionService).estaAutenticado()).toBe(false);
    expect(navegar).toHaveBeenCalledWith(['/ingresar'], { queryParams: { returnUrl: expect.any(String) } });
  });

  const correr = (guarda: typeof adminGuard, url = '/admin') =>
    TestBed.runInInjectionContext(() => guarda({} as never, { url } as never));

  it('sin sesión, las guardas mandan a /ingresar con la pantalla de regreso', () => {
    for (const guarda of [sesionGuard, adminGuard]) {
      expect(router.serializeUrl(correr(guarda, '/admin/pedidos/5') as never)).toBe('/ingresar?returnUrl=%2Fadmin%2Fpedidos%2F5');
    }
  });

  it('el administrador pasa por ambas guardas', () => {
    entrar();
    TestBed.inject(SesionService); // lee la sesión guardada
    expect(correr(sesionGuard)).toBe(true);
    expect(correr(adminGuard)).toBe(true);
  });

  it('un cliente pasa la guarda de sesión pero no la del panel: va a /mi-cuenta', () => {
    localStorage.setItem('jds_sesion', JSON.stringify({ ...SESION, user: { ...SESION.user, role: 'customer' } }));
    TestBed.inject(SesionService);

    expect(correr(sesionGuard)).toBe(true);
    expect(router.serializeUrl(correr(adminGuard) as never)).toBe('/mi-cuenta');
  });
});
