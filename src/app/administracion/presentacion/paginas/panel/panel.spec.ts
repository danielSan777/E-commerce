import { API_URL } from '../../../../core/configuracion/api';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AdminPanel } from './panel';

describe('AdminPanel', () => {
  async function montar() {
    localStorage.setItem('jds_sesion', JSON.stringify({ token: 't', expires_at: new Date(Date.now() + 3600_000).toISOString(), user: { name: 'Sele', email: 's@s.com', role: 'admin' } }));
    TestBed.configureTestingModule({ imports: [AdminPanel], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    const fixture = TestBed.createComponent(AdminPanel);
    await fixture.whenStable();
    return { fixture, ctrl: TestBed.inject(HttpTestingController), ir: vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true) };
  }

  it('saluda al administrador', async () => {
    const { fixture } = await montar();
    expect(fixture.nativeElement.textContent).toContain('Hola, Sele');
  });

  it('"Cerrar todas las sesiones" llama a logout-all y vuelve al ingreso', async () => {
    const { fixture, ctrl, ir } = await montar();
    const p = fixture.componentInstance.cerrarTodas();
    ctrl.expectOne('/api/v1/auth/logout-all').flush(null, { status: 204, statusText: 'No Content' });
    await p;

    expect(ir).toHaveBeenCalledWith(['/ingresar']);
    expect(localStorage.getItem('jds_sesion')).toBeNull();
  });
});
