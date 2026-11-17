import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../core/configuracion/api';
import { UbicacionesService } from './UbicacionesService';

const RESPUESTA = {
    zones: [
        { code: 'A', name: 'Zona A', price_cents: 350, extra_days: 0, is_available: true },
        { code: 'B', name: 'Zona B', price_cents: 625, extra_days: 1, is_available: true },
        { code: 'no_disponible', name: 'No disponible', price_cents: 0, extra_days: 0, is_available: false },
    ],
    provinces: [
        { code: '09', name: 'Guayas', cantons: [
            { code: '0901', name: 'Guayaquil', zone: 'A', is_locality: false },
            { code: '0906-01', name: 'La Aurora - Daule', zone: 'A', is_locality: true },
        ] },
        { code: '20', name: 'Galápagos', cantons: [{ code: '2001', name: 'San Cristóbal', zone: 'no_disponible', is_locality: false }] },
    ],
};

describe('UbicacionesService', () => {
    let servicio: UbicacionesService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
        servicio = TestBed.inject(UbicacionesService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('pide las ubicaciones una sola vez y las deja en listas', () => {
        servicio.cargar();
        servicio.cargar();
        http.expectOne('/api/v1/locations').flush(RESPUESTA);

        expect(servicio.listo()).toBe(true);
        expect(servicio.provincias()).toEqual(['Guayas', 'Galápagos']);
        expect(servicio.cantones('guayas')).toEqual(['Guayaquil', 'La Aurora - Daule']);
        expect(servicio.costo('Guayas', 'Guayaquil')).toBe(3.5);
        expect(servicio.zona('Guayas', 'La Aurora - Daule')).toBe('A');
        expect(servicio.disponible('Galápagos', 'San Cristóbal')).toBe(false);
        expect(servicio.esProvinciaSinEnvio('Galápagos')).toBe(true);
        expect(servicio.esProvinciaSinEnvio('Guayas')).toBe(false);
        expect(servicio.tarifaDesde()).toBe(3.5);
    });

    it('si falla, avisa y permite volver a intentar', () => {
        servicio.cargar();
        http.expectOne('/api/v1/locations').flush({}, { status: 500, statusText: 'Error' });
        expect(servicio.fallo()).toBe(true);
        expect(servicio.listo()).toBe(false);

        servicio.cargar();
        http.expectOne('/api/v1/locations').flush(RESPUESTA);
        expect(servicio.listo()).toBe(true);
        expect(servicio.fallo()).toBe(false);
    });
});
