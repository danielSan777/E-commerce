import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../core/configuracion/api';
import { CargandoService } from '../componentes/cargando/CargandoService';
import { cargandoInterceptor } from './cargandoInterceptor';

describe('cargandoInterceptor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([cargandoInterceptor])), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
  });
  afterEach(() => vi.useRealTimers());

  it('muestra la carga mientras una consulta a la API está pendiente y la quita al responder (también con error)', () => {
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);
    const s = TestBed.inject(CargandoService);

    http.get('/api/v1/categories').subscribe({ error: () => undefined });
    vi.advanceTimersByTime(250);
    expect(s.visible()).toBe(true);
    ctrl.expectOne('/api/v1/categories').flush({}, { status: 500, statusText: 'Error' });
    vi.advanceTimersByTime(700);
    expect(s.visible()).toBe(false);
  });

  it('ignora las consultas a otros sitios', () => {
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);
    http.get('https://otro-sitio.com/x').subscribe();
    vi.advanceTimersByTime(500);
    expect(TestBed.inject(CargandoService).visible()).toBe(false);
    ctrl.expectOne('https://otro-sitio.com/x').flush({});
  });
});
