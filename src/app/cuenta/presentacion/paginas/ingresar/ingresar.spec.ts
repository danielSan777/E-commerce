import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { Ingresar } from './ingresar';

const sesion = (role: 'admin' | 'customer') => ({ token: 't', token_type: 'Bearer', expires_at: new Date(Date.now() + 3600_000).toISOString(), user: { name: 'Sele', email: 'sele@jardindesele.com', role } });

describe('Ingresar', () => {
  let ctrl: HttpTestingController;

  async function montar(returnUrl: string | null = null) {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Ingresar],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => returnUrl } } } },
      ],
    });
    ctrl = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Ingresar);
    await fixture.whenStable();
    return fixture;
  }

  const enviar = (fixture: Awaited<ReturnType<typeof montar>>, email: string, password: string) => {
    Object.assign(fixture.componentInstance, { email, password });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
  };

  it('un administrador va a su panel', async () => {
    const fixture = await montar();
    const ir = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    enviar(fixture, ' sele@jardindesele.com ', 'clave');

    const req = ctrl.expectOne('/api/v1/auth/login');
    expect(req.request.body.email).toBe('sele@jardindesele.com');
    req.flush(sesion('admin'));
    await fixture.whenStable();

    expect(ir).toHaveBeenCalledWith('/admin');
    expect(fixture.componentInstance.password).toBe('');
  });

  it('un cliente va a su cuenta', async () => {
    const fixture = await montar();
    const ir = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    enviar(fixture, 'ana@correo.com', 'clave');

    ctrl.expectOne('/api/v1/auth/login').flush(sesion('customer'));
    await fixture.whenStable();

    expect(ir).toHaveBeenCalledWith('/mi-cuenta');
  });

  it('vuelve a la pantalla que se pidió (si es una ruta interna permitida)', async () => {
    const fixture = await montar('/consultar-pedido');
    const ir = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    enviar(fixture, 'ana@correo.com', 'clave');

    ctrl.expectOne('/api/v1/auth/login').flush(sesion('customer'));
    await fixture.whenStable();

    expect(ir).toHaveBeenCalledWith('/consultar-pedido');
  });

  it('con credenciales incorrectas muestra el mensaje de la API y no navega', async () => {
    const fixture = await montar();
    const ir = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    enviar(fixture, 'x@x.com', 'mala');

    ctrl.expectOne('/api/v1/auth/login').flush({ code: 'invalid_credentials', message: 'Correo o contraseña incorrectos.' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('Correo o contraseña incorrectos.');
    expect(ir).not.toHaveBeenCalled();
  });

  it('muestra el detalle de validación en español', async () => {
    const fixture = await montar();
    enviar(fixture, 'ana@correo.com', 'x');

    ctrl.expectOne('/api/v1/auth/login').flush({ code: 'validation_error', message: 'Revisa los datos ingresados.', errors: { email: ['Escribe tu correo.'], password: ['Escribe tu contraseña.'] } }, { status: 422, statusText: 'Unprocessable' });
    await fixture.whenStable();
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Revisa los datos ingresados.');
    expect(texto).toContain('Escribe tu correo.');
    expect(texto).toContain('Escribe tu contraseña.');
  });

  it('con correo y contraseña vacíos avisa en cada campo y NO llama a la API', async () => {
    const fixture = await montar();
    enviar(fixture, '', '');
    await fixture.whenStable();
    fixture.detectChanges();

    ctrl.expectNone('/api/v1/auth/login');
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Escribe tu correo.');
    expect(texto).toContain('Escribe tu contraseña.');
    expect(fixture.nativeElement.querySelector('#email').getAttribute('aria-invalid')).toBe('true');
    expect(TestBed.inject(AvisosService).lista().at(-1)?.texto).toContain('Faltan datos o hay datos incorrectos');
  });

  it('con un correo mal escrito avisa y no llama a la API', async () => {
    const fixture = await montar();
    enviar(fixture, 'sin-arroba', 'clave');
    await fixture.whenStable();
    fixture.detectChanges();

    ctrl.expectNone('/api/v1/auth/login');
    expect(fixture.nativeElement.textContent).toContain('Escribe un correo válido.');
  });

  it('si entra bien pero la navegación se bloquea, avisa en vez de quedar en blanco', async () => {
    const fixture = await montar();
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(false);
    enviar(fixture, 'ana@correo.com', 'clave');

    ctrl.expectOne('/api/v1/auth/login').flush(sesion('customer'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('no pudimos abrir la pantalla');
  });

  it('si la API responde algo inesperado muestra un mensaje general', async () => {
    const fixture = await montar();
    enviar(fixture, 'ana@correo.com', 'clave');

    ctrl.expectOne('/api/v1/auth/login').error(new ProgressEvent('error'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('No pudimos conectarnos');
  });

  it('ofrece crear cuenta', async () => {
    const fixture = await montar();
    expect(fixture.nativeElement.querySelector('a[href="/crear-cuenta"]')).not.toBeNull();
  });
});
