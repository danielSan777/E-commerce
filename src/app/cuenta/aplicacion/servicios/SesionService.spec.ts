import { API_URL } from '../../../core/configuracion/api';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SesionService } from './SesionService';

const RESPUESTA = { token: 'abc123', token_type: 'Bearer', expires_at: new Date(Date.now() + 3600_000).toISOString(), user: { name: 'Sele', email: 'sele@jardindesele.com', role: 'admin' } };

describe('SesionService', () => {
  let http: HttpTestingController;

  function crear(): SesionService {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(SesionService);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => http.verify());

  it('inicia sesión: guarda el token y expone el usuario', async () => {
    const s = crear();
    const p = s.iniciarSesion('sele@jardindesele.com', 'clave');
    const req = http.expectOne('/api/v1/auth/login');
    expect(req.request.body.email).toBe('sele@jardindesele.com');
    req.flush(RESPUESTA);
    await p;

    expect(s.estaAutenticado()).toBe(true);
    expect(s.token()).toBe('abc123');
    expect(s.usuario()?.name).toBe('Sele');
    expect(s.esAdministrador()).toBe(true);
    expect(JSON.parse(localStorage.getItem('jds_sesion')!).token).toBe('abc123');
  });

  it('el vencimiento se calcula con expires_in (reloj del navegador), no con la fecha del servidor', async () => {
    const s = crear();
    const p = s.iniciarSesion('sele@jardindesele.com', 'clave');
    // el servidor manda una fecha "ya vencida" (reloj desfasado) pero con 1 hora de vida
    http.expectOne('/api/v1/auth/login').flush({ ...RESPUESTA, expires_at: '2000-01-01T00:00:00+00:00', expires_in: 3600 });
    await p;

    expect(s.estaAutenticado()).toBe(true);
  });

  it('si el servidor manda un vencimiento ya pasado y no manda expires_in, la sesión no nace vencida', async () => {
    const s = crear();
    const p = s.iniciarSesion('sele@jardindesele.com', 'clave');
    const { expires_in, ...viejo } = { ...RESPUESTA, expires_in: 0 };
    http.expectOne('/api/v1/auth/login').flush({ ...viejo, expires_at: '2020-01-01T00:00:00+00:00' });
    await p;

    expect(s.estaAutenticado()).toBe(true);
    expect(s.token()).toBe('abc123');
  });

  it('crear cuenta: llama a /auth/register, guarda la sesión del cliente', async () => {
    const s = crear();
    const p = s.crearCuenta({ name: 'Ana', email: 'ana@correo.com', password: 'clave-segura-1', password_confirmation: 'clave-segura-1' });
    const req = http.expectOne('/api/v1/auth/register');
    expect(req.request.body.name).toBe('Ana');
    req.flush({ ...RESPUESTA, user: { name: 'Ana', email: 'ana@correo.com', role: 'customer' } }, { status: 201, statusText: 'Created' });
    await p;

    expect(s.estaAutenticado()).toBe(true);
    expect(s.esAdministrador()).toBe(false);
    expect(s.usuario()?.role).toBe('customer');
  });

  it('credenciales incorrectas: lanza el mensaje en español de la API y no guarda nada', async () => {
    const s = crear();
    const p = s.iniciarSesion('x@x.com', 'mala');
    http.expectOne('/api/v1/auth/login').flush({ code: 'invalid_credentials', message: 'Correo o contraseña incorrectos.' }, { status: 401, statusText: 'Unauthorized' });

    await expect(p).rejects.toMatchObject({ status: 401, code: 'invalid_credentials', message: 'Correo o contraseña incorrectos.' });
    expect(s.estaAutenticado()).toBe(false);
    expect(localStorage.getItem('jds_sesion')).toBeNull();
  });

  it('errores de validación (422) conservan el detalle por campo', async () => {
    const s = crear();
    const p = s.iniciarSesion('', '');
    http.expectOne('/api/v1/auth/login').flush(
      { code: 'validation_error', message: 'Revisa los datos ingresados.', errors: { email: ['Escribe tu correo.'] } },
      { status: 422, statusText: 'Unprocessable' },
    );

    await expect(p).rejects.toMatchObject({ code: 'validation_error', errors: { email: ['Escribe tu correo.'] } });
  });

  it('demasiados intentos (429) y fallos de red tienen mensaje propio', async () => {
    const s = crear();
    const a = s.iniciarSesion('a@a.com', 'x');
    http.expectOne('/api/v1/auth/login').flush('', { status: 429, statusText: 'Too Many' });
    await expect(a).rejects.toMatchObject({ code: 'too_many_requests' });

    const b = s.iniciarSesion('a@a.com', 'x');
    http.expectOne('/api/v1/auth/login').error(new ProgressEvent('error'));
    await expect(b).rejects.toMatchObject({ code: 'network_error' });
  });

  it('una sesión vencida se descarta', () => {
    localStorage.setItem('jds_sesion', JSON.stringify({ ...RESPUESTA, expires_at: new Date(Date.now() - 1000).toISOString() }));
    const s = crear();

    expect(s.estaAutenticado()).toBe(false);
    expect(s.token()).toBeNull();
    expect(localStorage.getItem('jds_sesion')).toBeNull();
  });

  it('recupera la sesión guardada al recargar la página', () => {
    localStorage.setItem('jds_sesion', JSON.stringify(RESPUESTA));
    const s = crear();

    expect(s.estaAutenticado()).toBe(true);
    expect(s.usuario()?.email).toBe('sele@jardindesele.com');
  });

  it('cerrar sesión llama a logout y limpia el navegador', async () => {
    localStorage.setItem('jds_sesion', JSON.stringify(RESPUESTA));
    const s = crear();
    const p = s.cerrarSesion();
    http.expectOne('/api/v1/auth/logout').flush(null, { status: 204, statusText: 'No Content' });
    await p;

    expect(s.estaAutenticado()).toBe(false);
    expect(localStorage.getItem('jds_sesion')).toBeNull();
  });

  it('cerrar todas las sesiones llama a logout-all; si la API falla igual limpia el navegador y avisa', async () => {
    localStorage.setItem('jds_sesion', JSON.stringify(RESPUESTA));
    const s = crear();
    const p = s.cerrarTodas();
    http.expectOne('/api/v1/auth/logout-all').flush({ code: 'server_error', message: 'Error del servidor.' }, { status: 500, statusText: 'Error' });

    await expect(p).rejects.toMatchObject({ message: 'Error del servidor.' });
    expect(s.estaAutenticado()).toBe(false);
  });
});
