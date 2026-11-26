import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../core/configuracion/api';
import { RegistroDeBusquedasService } from './RegistroDeBusquedasService';

describe('RegistroDeBusquedasService', () => {
  it('envía el término y la cantidad de resultados, y un error no se propaga', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    const http = TestBed.inject(HttpTestingController);

    expect(() => TestBed.inject(RegistroDeBusquedasService).registrar('galápagos', 0)).not.toThrow();
    const r = http.expectOne('/api/v1/search-log');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual({ term: 'galápagos', results_count: 0 });
    expect(() => r.flush({}, { status: 500, statusText: 'Error' })).not.toThrow();
    http.verify();
  });
});
