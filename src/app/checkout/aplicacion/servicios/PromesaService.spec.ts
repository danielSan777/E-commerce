import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../core/configuracion/api';
import { PROMESA_API, VENTANAS_API } from '../../../testing/entrega-api';
import { PromesaService, etiquetaContador } from './PromesaService';

describe('PromesaService (API de Laravel)', () => {
    let servicio: PromesaService;
    let http: HttpTestingController;
    let reloj = 1000;

    beforeEach(() => {
        reloj = 1000;
        vi.spyOn(performance, 'now').mockImplementation(() => reloj);
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
        servicio = TestBed.inject(PromesaService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => { http.verify(); vi.restoreAllMocks(); });

    function cargar(canton = '') {
        servicio.cargar(canton, true);
        const query = canton ? `?canton=${canton}` : '';
        http.expectOne(r => r.url === '/api/v1/delivery/promise' && r.urlWithParams === `/api/v1/delivery/promise${query}`).flush(PROMESA_API);
        http.expectOne(r => r.url === '/api/v1/delivery/windows' && r.urlWithParams === `/api/v1/delivery/windows${query}`).flush({ windows: VENTANAS_API });
    }

    it('pide la promesa y las ventanas a Laravel y las deja disponibles', () => {
        cargar();
        expect(servicio.promesa()?.label).toBe('Recíbelo entre jueves 12 y viernes 13 de noviembre');
        expect(servicio.ventanas().length).toBe(VENTANAS_API.length);
    });

    it('con un cantón lo envía en la petición (la Amazonía suma un día en Laravel)', () => {
        cargar('1501');
        expect(servicio.promesa()).not.toBeNull();
    });

    it('reutiliza lo pedido hace menos de 30 segundos para el mismo destino', () => {
        cargar();
        servicio.cargar();
        http.expectNone('/api/v1/delivery/promise');
    });

    it('el contador sale de la hora del servidor más el reloj monótono, no del reloj del teléfono', () => {
        cargar();
        expect(servicio.contador()).toBe('Pídelo en las próximas 3 h 42 min');
    });

    it('si el reloj monótono avanza, el contador baja', () => {
        cargar();
        reloj += 42 * 60_000;                       // pasan 42 minutos
        servicio.cargar('', false);                 // (reutiliza) y solo fuerza el recálculo del latido
        // el latido recalcula el contador con la misma ancla
        (servicio as unknown as { latido: { update: (f: (n: number) => number) => void } }).latido.update(n => n + 1);
        expect(servicio.contador()).toBe('Pídelo en las próximas 3 h 0 min');
    });

    it('una ventana es vigente solo si Laravel la ofrece y está disponible', () => {
        cargar();
        expect(servicio.esVigente('2026-11-14', '2026-11-16')).toBe(true);
        expect(servicio.esVigente('2026-11-17', '2026-11-18')).toBe(false);   // llena
        expect(servicio.esVigente('2026-11-02', '2026-11-03')).toBe(false);   // en el pasado
    });

    it('si Laravel falla avisa y permite volver a pedir', () => {
        servicio.cargar('', true);
        http.expectOne(r => r.url === '/api/v1/delivery/promise').flush({}, { status: 500, statusText: 'Error' });
        http.expectOne(r => r.url === '/api/v1/delivery/windows').flush({}, { status: 500, statusText: 'Error' });
        expect(servicio.fallo()).toBe(true);
        expect(servicio.promesa()).toBeNull();
        expect(servicio.contador()).toBe('');
    });

    it('formatea el contador: horas y minutos, o solo minutos', () => {
        expect(etiquetaContador(13_320_000)).toBe('Pídelo en las próximas 3 h 42 min');
        expect(etiquetaContador(15 * 60_000)).toBe('Pídelo en las próximas 15 min');
        expect(etiquetaContador(30_000)).toBe('Pídelo en las próximas 1 min');
    });
});
