import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from '../../../core/configuracion/api';
import { ConfiguradorApi } from '../../dominio/configurador';
import { ConfiguradorService } from './ConfiguradorService';

const GEO = { x: 10, y: 20, width: 30, height: 15, rot_x: 5, rot_y: -10, rot_z: 90, mirror: true };

const RESPUESTA: ConfiguradorApi = {
    source: 'category',
    configured: true,
    locations: [
        { location_id: 7, name: 'Cabeza', allowed_categories: ['Moda'], excluded_categories: [], state: 'libre', priority: 1, layer: 2, fixed_accessory_id: null, preset: GEO },
        { location_id: 8, name: 'Pie', allowed_categories: [], excluded_categories: ['Moda'], state: 'fija', priority: 2, layer: 1, fixed_accessory_id: 20, preset: null },
    ],
    accessories: [
        { id: 20, name: 'Gafas', type: 'imagen', behavior: 'gafas', text: null, category: 'Moda', image: 'https://api.test/media/accessories/20-1080.webp', thumb: null, alt: 'Gafas' },
        { id: 21, name: 'Nombre', type: 'texto', behavior: null, text: 'Ingrese su nombre.', category: 'Personalización', image: null, thumb: null, alt: null },
    ],
    exceptions: [{ accessory_id: 20, location_id: 7, ...GEO }],
};

describe('ConfiguradorService', () => {
    let http: HttpTestingController;
    let servicio: ConfiguradorService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: 'https://api.test/api/v1' }],
        });
        http = TestBed.inject(HttpTestingController);
        servicio = TestBed.inject(ConfiguradorService);
    });

    afterEach(() => http.verify());

    it('pide el configurador del producto por su dirección y traduce el contrato a los modelos del personalizador', () => {
        let resultado: Awaited<ReturnType<() => unknown>> | undefined;
        servicio.configuracion('doctor').subscribe(c => (resultado = c));
        http.expectOne('https://api.test/api/v1/products/doctor/configurator').flush(RESPUESTA);

        expect(resultado).toEqual({
            configurado: true,
            ubicaciones: [
                { id: 7, nombre: 'Cabeza', categorias: ['Moda'], excluidas: undefined, estado: 'libre', prioridad: 1, capa: 2, fijoId: null,
                    preset: { x: 10, y: 20, ancho: 30, alto: 15, rotX: 5, rotY: -10, rotZ: 90, espejo: true } },
                { id: 8, nombre: 'Pie', categorias: undefined, excluidas: ['Moda'], estado: 'fija', prioridad: 2, capa: 1, fijoId: 20, preset: null },
            ],
            excepciones: [{ accesorioId: 20, ubicacionId: 7, x: 10, y: 20, ancho: 30, alto: 15, rotX: 5, rotY: -10, rotZ: 90, espejo: true }],
            catalogo: [
                { id: 20, nombre: 'Gafas', imagen: 'https://api.test/media/accessories/20-1080.webp', tipo: 'imagen', texto: undefined, categoria: 'Moda', comportamiento: 'gafas' },
                { id: 21, nombre: 'Nombre', imagen: '', tipo: 'texto', texto: 'Ingrese su nombre.', categoria: 'Personalización', comportamiento: null },
            ],
        });
    });

    it('un producto sin configuración llega con configurado = false y sin accesorios', () => {
        let resultado: { configurado?: boolean; catalogo?: unknown[] } | undefined;
        servicio.configuracion('homero').subscribe(c => (resultado = c));
        http.expectOne('https://api.test/api/v1/products/homero/configurator').flush({ source: 'category', configured: false, locations: [], accessories: [], exceptions: [] });

        expect(resultado?.configurado).toBe(false);
        expect(resultado?.catalogo).toEqual([]);
    });
});
