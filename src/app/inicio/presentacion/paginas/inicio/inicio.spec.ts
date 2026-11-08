import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../../core/configuracion/api';
import { RESUMEN_CATEGORIAS_API, productoListadoApi } from '../../../../testing/catalogo-api';
import { provideRouter } from '@angular/router';
import { Inicio } from './inicio';

describe('Inicio (/)', () => {
    async function montar() {
        TestBed.configureTestingModule({ imports: [Inicio], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
        const ctrl = TestBed.inject(HttpTestingController);
        const fixture = TestBed.createComponent(Inicio);
        ctrl.expectOne('/api/v1/categories').flush({ data: RESUMEN_CATEGORIAS_API });
        ctrl.expectOne('/api/v1/products?limit=6').flush({ data: ['a', 'b', 'c', 'd', 'e', 'f'].map(s => productoListadoApi(s)) });
        await fixture.whenStable();
        return fixture.nativeElement as HTMLElement;
    }

    it('tiene el botón "Encuentra tu detalle perfecto" hacia /categorias', async () => {
        const html = await montar();
        const boton = html.querySelector('.hero a.boton') as HTMLAnchorElement;

        expect(boton.textContent).toContain('Encuentra tu detalle perfecto');
        expect(boton.getAttribute('href')).toBe('/categorias');
    });

    it('muestra la promesa del mock y el envío gratis desde 2 macetas', async () => {
        const html = await montar();

        expect(html.querySelector('.promesa')?.textContent).toContain('Recíbelo entre jueves 12 y viernes 13 de noviembre');
        expect(html.querySelector('.promesa')?.textContent).toContain('Envío gratis llevando 2 macetas');
    });

    it('muestra las 4 categorías, los favoritos y los 3 pasos', async () => {
        const html = await montar();

        expect(html.querySelectorAll('.categoria').length).toBe(4);
        expect(html.querySelectorAll('.favoritos .producto').length).toBe(6);
        expect(html.querySelectorAll('.pasos li').length).toBe(3);
    });

    it('sin video cargado muestra la portada como imagen', async () => {
        const html = await montar();

        expect(html.querySelector('video')).toBeNull();
        expect(html.querySelector('img.hero-medio')).not.toBeNull();
    });
});
