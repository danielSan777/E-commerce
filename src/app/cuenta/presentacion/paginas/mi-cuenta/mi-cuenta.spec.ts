import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { MiCuenta } from './mi-cuenta';

describe('MiCuenta', () => {
  async function montar(role: 'admin' | 'customer') {
    localStorage.setItem('jds_sesion', JSON.stringify({ token: 't', expires_at: new Date(Date.now() + 3600_000).toISOString(), user: { name: 'Ana', email: 'ana@correo.com', role } }));
    TestBed.configureTestingModule({ imports: [MiCuenta], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    const fixture = TestBed.createComponent(MiCuenta);
    await fixture.whenStable();
    return { fixture, ctrl: TestBed.inject(HttpTestingController), ir: vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true) };
  }

  it('saluda al cliente y no ofrece el panel', async () => {
    const { fixture } = await montar('customer');
    expect(fixture.nativeElement.textContent).toContain('Hola, Ana');
    expect(fixture.nativeElement.querySelector('a[href="/admin"]')).toBeNull();
  });

  it('un administrador ve el enlace al panel', async () => {
    const { fixture } = await montar('admin');
    expect(fixture.nativeElement.querySelector('a[href="/admin"]')).not.toBeNull();
  });

  it('cerrar sesión llama a logout y vuelve al ingreso', async () => {
    const { fixture, ctrl, ir } = await montar('customer');
    const p = fixture.componentInstance.cerrarSesion();
    ctrl.expectOne('/api/v1/auth/logout').flush(null, { status: 204, statusText: 'No Content' });
    await p;

    expect(ir).toHaveBeenCalledWith(['/ingresar']);
    expect(localStorage.getItem('jds_sesion')).toBeNull();
  });
});
