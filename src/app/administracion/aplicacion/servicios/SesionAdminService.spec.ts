import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SesionAdminService } from './SesionAdminService';

const RESPUESTA = { token: 'abc123', token_type: 'Bearer', expires_at: new Date(Date.now() + 3600_000).toISOString(), user: { name: 'Sele', email: 'sele@jardindesele.com' } };

describe('SesionAdminService', () => {
  let http: HttpTestingController;

  function crear(): SesionAdminService {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(SesionAdminService);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => http.verify());

  it('inicia sesión: guarda el token y expone el usuario', async () => {
    const s = crear();
    const p = s.iniciarSesion('sele@jardindesele.com', 'clave');
    const req = http.expectOne('/api/v1/admin/login');
    expect(req.request.body.email).toBe('sele@jardindesele.com');
    req.flush(RESPUESTA);
    await p;

    expect(s.estaAutenticado()).toBe(true);
    expect(s.token()).toBe('abc123');
    expect(s.usuario()?.name).toBe('Sele');
    expect(JSON.parse(localStorage.getItem('jds_admin_sesion')!).token).toBe('abc123');
  });

  it('credenciales incorrectas: lanza el mensaje en español de la API y no guarda nada', async () => {
    const s = crear();
    const p = s.iniciarSesion('x@x.com', 'mala');
    http.expectOne('/api/v1/admin/login').flush({ code: 'invalid_credentials', message: 'Correo o contraseña incorrectos.' }, { status: 401, statusText: 'Unauthorized' });

    await expect(p).rejects.toMatchObject({ status: 401, code: 'invalid_credentials', message: 'Correo o contraseña incorrectos.' });
    expect(s.estaAutenticado()).toBe(false);
    expect(localStorage.getItem('jds_admin_sesion')).toBeNull();
  });

  it('errores de validación (422) conservan el detalle por campo', async () => {
    const s = crear();
    const p = s.iniciarSesion('', '');
    http.expectOne('/api/v1/admin/login').flush(
      { code: 'validation_error', message: 'Revisa los datos ingresados.', errors: { email: ['Escribe tu correo.'] } },
      { status: 422, statusText: 'Unprocessable' },
    );

    await expect(p).rejects.toMatchObject({ code: 'validation_error', errors: { email: ['Escribe tu correo.'] } });
  });

  it('demasiados intentos (429) y fallos de red tienen mensaje propio', async () => {
    const s = crear();
    const a = s.iniciarSesion('a@a.com', 'x');
    http.expectOne('/api/v1/admin/login').flush('', { status: 429, statusText: 'Too Many' });
    await expect(a).rejects.toMatchObject({ code: 'too_many_requests' });

    const b = s.iniciarSesion('a@a.com', 'x');
    http.expectOne('/api/v1/admin/login').error(new ProgressEvent('error'));
    await expect(b).rejects.toMatchObject({ code: 'network_error' });
  });

  it('una sesión vencida se descarta', () => {
    localStorage.setItem('jds_admin_sesion', JSON.stringify({ ...RESPUESTA, expires_at: new Date(Date.now() - 1000).toISOString() }));
    const s = crear();

    expect(s.estaAutenticado()).toBe(false);
    expect(s.token()).toBeNull();
    expect(localStorage.getItem('jds_admin_sesion')).toBeNull();
  });

  it('recupera la sesión guardada al recargar la página', () => {
    localStorage.setItem('jds_admin_sesion', JSON.stringify(RESPUESTA));
    const s = crear();

    expect(s.estaAutenticado()).toBe(true);
    expect(s.usuario()?.email).toBe('sele@jardindesele.com');
  });

  it('cerrar sesión llama a logout y limpia el navegador', async () => {
    localStorage.setItem('jds_admin_sesion', JSON.stringify(RESPUESTA));
    const s = crear();
    const p = s.cerrarSesion();
    http.expectOne('/api/v1/admin/logout').flush(null, { status: 204, statusText: 'No Content' });
    await p;

    expect(s.estaAutenticado()).toBe(false);
    expect(localStorage.getItem('jds_admin_sesion')).toBeNull();
  });

  it('cerrar todas las sesiones llama a logout-all; si la API falla igual limpia el navegador y avisa', async () => {
    localStorage.setItem('jds_admin_sesion', JSON.stringify(RESPUESTA));
    const s = crear();
    const p = s.cerrarTodas();
    http.expectOne('/api/v1/admin/logout-all').flush({ code: 'server_error', message: 'Error del servidor.' }, { status: 500, statusText: 'Error' });

    await expect(p).rejects.toMatchObject({ message: 'Error del servidor.' });
    expect(s.estaAutenticado()).toBe(false);
  });
});
