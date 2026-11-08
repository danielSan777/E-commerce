import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../core/configuracion/api';
import { productoListadoApi } from '../../../testing/catalogo-api';
import { BusquedaService } from './BusquedaService';

describe('BusquedaService (índice de Laravel)', () => {
    function montar() {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
        return { servicio: TestBed.inject(BusquedaService), ctrl: TestBed.inject(HttpTestingController) };
    }

    it('encuentra por nombre, palabra de búsqueda (médico → Doctor), categoría y subcategoría, sin importar tildes', async () => {
        const { servicio, ctrl } = montar();
        ctrl.expectOne('/api/v1/products').flush({ data: [
            productoListadoApi('doctor', 'Doctor', { search_terms: ['medico'], category: { slug: 'p', name: 'Profesiones y Hobbies' }, subcategory: { slug: 's', name: 'Salud' } }),
            productoListadoApi('bob', 'Bob'),
        ] });
        ctrl.expectOne('/api/v1/products?limit=6').flush({ data: [] });
        await Promise.resolve();

        expect(servicio.buscar('médico').map(p => p.slug)).toEqual(['doctor']);
        expect(servicio.buscar('salud').map(p => p.slug)).toEqual(['doctor']);
        expect(servicio.buscar('bob').map(p => p.slug)).toEqual(['bob']);
        expect(servicio.buscar('zzz')).toEqual([]);
    });

    it('si la API falla la búsqueda no se rompe: sin resultados y sin favoritos', async () => {
        const { servicio, ctrl } = montar();
        ctrl.expectOne('/api/v1/products').flush({}, { status: 500, statusText: 'Error' });
        ctrl.expectOne('/api/v1/products?limit=6').flush({}, { status: 500, statusText: 'Error' });
        await Promise.resolve();

        expect(servicio.buscar('doctor')).toEqual([]);
        expect(servicio.favoritos()).toEqual([]);
    });

    it('los favoritos son los productos que entrega Laravel', async () => {
        const { servicio, ctrl } = montar();
        ctrl.expectOne('/api/v1/products').flush({ data: [] });
        ctrl.expectOne('/api/v1/products?limit=6').flush({ data: [productoListadoApi('a'), productoListadoApi('b')] });
        await Promise.resolve();

        expect(servicio.favoritos().map(p => p.slug)).toEqual(['a', 'b']);
    });
});
