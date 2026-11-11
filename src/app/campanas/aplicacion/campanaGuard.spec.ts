import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom } from 'rxjs';
import { Router, UrlSegment, UrlTree, provideRouter } from '@angular/router';
import { API_URL } from '../../core/configuracion/api';
import { campanaGuard } from './campanaGuard';

describe('campanaGuard (¿esta dirección es una campaña?)', () => {
    let ctrl: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
        ctrl = TestBed.inject(HttpTestingController);
    });

    const preguntar = (...tramos: string[]) =>
        TestBed.runInInjectionContext(() => campanaGuard({} as never, tramos.map(t => new UrlSegment(t, {})), {} as never)) as Observable<boolean | UrlTree> | boolean;

    it('deja pasar la dirección si Laravel conoce la campaña', async () => {
        const r = preguntar('navidad') as Observable<boolean | UrlTree>;
        const p = firstValueFrom(r);
        ctrl.expectOne('/api/v1/campaigns/navidad').flush({ slug: 'navidad', name: 'Navidad', state: 'active', products: [], seo: {}, related_category: {} });

        expect(await p).toBe(true);
    });

    it('si la campaña no está en temporada (terminada o por llegar), lleva a la página principal', async () => {
        for (const estado of ['closing', 'upcoming']) {
            const p = firstValueFrom(preguntar(`san-valentin-${estado}`) as Observable<boolean | UrlTree>);
            ctrl.expectOne(`/api/v1/campaigns/san-valentin-${estado}`).flush({ slug: 'san-valentin', name: 'San Valentín', state: estado, products: [], seo: {}, related_category: {} });
            const r = await p;

            expect(r instanceof UrlTree).toBe(true);
            expect(TestBed.inject(Router).serializeUrl(r as UrlTree)).toBe('/');
        }
    });

    it('si Laravel responde 404, la ruta no coincide y el router sigue con las categorías', async () => {
        const p = firstValueFrom(preguntar('amor') as Observable<boolean | UrlTree>);
        ctrl.expectOne('/api/v1/campaigns/amor').flush({ code: 'not_found', message: 'x' }, { status: 404, statusText: 'Not Found' });

        expect(await p).toBe(false);
    });

    it('si la API falla, tampoco coincide (la categoría mostrará su propio aviso)', async () => {
        const p = firstValueFrom(preguntar('amor') as Observable<boolean | UrlTree>);
        ctrl.expectOne('/api/v1/campaigns/amor').flush({ message: 'x' }, { status: 500, statusText: 'Error' });

        expect(await p).toBe(false);
    });

    it('solo las direcciones de un tramo pueden ser campañas', () => {
        expect(preguntar('amor', 'salud')).toBe(false);
        ctrl.expectNone(() => true);
    });
});

describe('campanaGuard con las categorías ya conocidas', () => {
    it('una dirección que es categoría entra al instante, sin preguntarle a Laravel por una campaña', async () => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
        const { CategoriaService } = await import('../../categorias/aplicacion/servicios/CategoriaService');
        const { RESUMEN_CATEGORIAS_API } = await import('../../testing/catalogo-api');
        const ctrl = TestBed.inject(HttpTestingController);
        const p = firstValueFrom(TestBed.inject(CategoriaService).categorias());
        ctrl.expectOne('/api/v1/categories').flush({ data: RESUMEN_CATEGORIAS_API });
        await p;

        const r = TestBed.runInInjectionContext(() => campanaGuard({} as never, [new UrlSegment('amor', {})], {} as never));
        expect(r).toBe(false);
        ctrl.expectNone('/api/v1/campaigns/amor');
        // una dirección que no es categoría sí se le pregunta a Laravel
        const q = TestBed.runInInjectionContext(() => campanaGuard({} as never, [new UrlSegment('navidad', {})], {} as never)) as Observable<boolean>;
        void firstValueFrom(q);
        ctrl.expectOne('/api/v1/campaigns/navidad');
    });
});
