import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { CrearCuenta } from './crear-cuenta';

describe('CrearCuenta', () => {
  let ctrl: HttpTestingController;

  async function montar() {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [CrearCuenta],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    });
    ctrl = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(CrearCuenta);
    await fixture.whenStable();
    return fixture;
  }

  const enviar = (fixture: Awaited<ReturnType<typeof montar>>) => {
    Object.assign(fixture.componentInstance, { name: ' Ana Pérez ', email: 'ana@correo.com', password: 'clave-segura-1', confirmacion: 'clave-segura-1' });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
  };

  it('crea la cuenta, no manda ningún rol y lleva al cliente a su cuenta', async () => {
    const fixture = await montar();
    const ir = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    enviar(fixture);

    const req = ctrl.expectOne('/api/v1/auth/register');
    expect(req.request.body).toMatchObject({ name: 'Ana Pérez', email: 'ana@correo.com', password: 'clave-segura-1', password_confirmation: 'clave-segura-1' });
    expect('role' in req.request.body).toBe(false);
    req.flush({ token: 't', token_type: 'Bearer', expires_at: new Date(Date.now() + 3600_000).toISOString(), user: { name: 'Ana Pérez', email: 'ana@correo.com', role: 'customer' } }, { status: 201, statusText: 'Created' });
    await fixture.whenStable();

    expect(ir).toHaveBeenCalledWith('/mi-cuenta');
    expect(fixture.componentInstance.password).toBe('');
  });

  it('muestra los errores de Laravel en español (por ejemplo correo repetido)', async () => {
    const fixture = await montar();
    const ir = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    enviar(fixture);

    ctrl.expectOne('/api/v1/auth/register').flush(
      { code: 'validation_error', message: 'Revisa los datos ingresados.', errors: { email: ['Ya existe una cuenta con ese correo. Inicia sesión.'] } },
      { status: 422, statusText: 'Unprocessable' },
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ya existe una cuenta con ese correo. Inicia sesión.');
    expect(ir).not.toHaveBeenCalled();
  });
});
