import { API_URL } from '../../../../core/configuracion/api';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { AdminLogin, destinoSeguro } from './login';

describe('destinoSeguro', () => {
  it('solo vuelve a rutas internas del panel', () => {
    expect(destinoSeguro('/admin/pedidos/5')).toBe('/admin/pedidos/5');
    expect(destinoSeguro(null)).toBe('/admin');
    expect(destinoSeguro('https://malo.com')).toBe('/admin');
    expect(destinoSeguro('//malo.com')).toBe('/admin');
    expect(destinoSeguro('/administrador-falso')).toBe('/admin');
    expect(destinoSeguro('/admin/login')).toBe('/admin');
  });
});

describe('AdminLogin', () => {
  let ctrl: HttpTestingController;

  async function montar(returnUrl: string | null = null) {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [AdminLogin],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => returnUrl } } } },
      ],
    });
    ctrl = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminLogin);
    await fixture.whenStable();
    return fixture;
  }

  const enviar = async (fixture: Awaited<ReturnType<typeof montar>>, email: string, password: string) => {
    Object.assign(fixture.componentInstance, { email, password });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
  };

  it('con credenciales correctas entra al panel (o a la pantalla pedida)', async () => {
    const fixture = await montar('/admin/pedidos/5');
    const ir = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await enviar(fixture, ' sele@jardindesele.com ', 'clave');

    ctrl.expectOne('/api/v1/admin/login').flush({ token: 't', token_type: 'Bearer', expires_at: new Date(Date.now() + 3600_000).toISOString(), user: { name: 'Sele', email: 'sele@jardindesele.com' } });
    await fixture.whenStable();

    expect(ir).toHaveBeenCalledWith('/admin/pedidos/5');
    expect(fixture.componentInstance.password).toBe('');
  });

  it('con credenciales incorrectas muestra el mensaje de la API y no navega', async () => {
    const fixture = await montar();
    const ir = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await enviar(fixture, 'x@x.com', 'mala');

    ctrl.expectOne('/api/v1/admin/login').flush({ code: 'invalid_credentials', message: 'Correo o contraseña incorrectos.' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('Correo o contraseña incorrectos.');
    expect(ir).not.toHaveBeenCalled();
  });

  it('muestra el detalle de validación en español', async () => {
    const fixture = await montar();
    await enviar(fixture, '', '');

    ctrl.expectOne('/api/v1/admin/login').flush({ code: 'validation_error', message: 'Revisa los datos ingresados.', errors: { email: ['Escribe tu correo.'], password: ['Escribe tu contraseña.'] } }, { status: 422, statusText: 'Unprocessable' });
    await fixture.whenStable();
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Revisa los datos ingresados.');
    expect(texto).toContain('Escribe tu correo.');
    expect(texto).toContain('Escribe tu contraseña.');
  });
});
