import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom } from 'rxjs';
import { Router, UrlSegment, UrlTree, provideRouter } from '@angular/router';
import { API_URL } from '../../core/configuracion/api';
import { campanaGuard } from './campanaGuard';
import { SesionService } from '../../cuenta/aplicacion/servicios/SesionService';

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
        ctrl.expectOne('/api/v1/campaigns/navidad').flush({ slug: 'navidad', name: 'Navidad', state: 'active', products: [], seo: {} });

        expect(await p).toBe(true);
    });

    it('al terminar la campaña deja entrar mientras se muestre su mensaje de cierre', async () => {
        const p = firstValueFrom(preguntar('san-valentin-cierre') as Observable<boolean | UrlTree>);
        ctrl.expectOne('/api/v1/campaigns/san-valentin-cierre').flush({ slug: 'san-valentin-cierre', name: 'SV', state: 'closing', closing_message: 'San Valentín regresará pronto', products: [], seo: {} });

        expect(await p).toBe(true);
    });

    it('si la campaña aún no empieza, o ya pasó la fecha del mensaje, lleva a la página principal', async () => {
        for (const estado of ['upcoming']) {
            const p = firstValueFrom(preguntar(`san-valentin-${estado}`) as Observable<boolean | UrlTree>);
            ctrl.expectOne(`/api/v1/campaigns/san-valentin-${estado}`).flush({ slug: `san-valentin-${estado}`, name: 'San Valentín', state: estado, products: [], seo: {} });
            const r = await p;

            expect(r instanceof UrlTree).toBe(true);
            expect(TestBed.inject(Router).serializeUrl(r as UrlTree)).toBe('/');
        }
    });

    it('el administrador entra a una campaña fuera de temporada con la vista previa de Laravel', async () => {
        TestBed.inject(SesionService)['guardar']({ token: 't', user: { id: 1, name: 'A', email: 'a@a.com', role: 'admin' } } as never);
        const p = firstValueFrom(preguntar('san-valentin-previa') as Observable<boolean | UrlTree>);
        ctrl.expectOne('/api/v1/campaigns/san-valentin-previa').flush({ slug: 'san-valentin-previa', name: 'SV', state: 'upcoming', products: [], seo: {} });
        await Promise.resolve();
        ctrl.expectOne('/api/v1/admin/campaigns/san-valentin-previa/preview').flush({ slug: 'san-valentin-previa', name: 'SV', state: 'active', products: [], seo: {} });

        expect(await p).toBe(true);
    });

    it('el administrador también entra a una campaña inactiva (el público recibe 404)', async () => {
        TestBed.inject(SesionService)['guardar']({ token: 't', user: { id: 1, name: 'A', email: 'a@a.com', role: 'admin' } } as never);
        const p = firstValueFrom(preguntar('san-valentin-inactiva') as Observable<boolean | UrlTree>);
        ctrl.expectOne('/api/v1/campaigns/san-valentin-inactiva').flush({ code: 'not_found', message: 'x' }, { status: 404, statusText: 'Not Found' });
        await Promise.resolve();
        ctrl.expectOne('/api/v1/admin/campaigns/san-valentin-inactiva/preview').flush({ slug: 'san-valentin-inactiva', name: 'SV', state: 'active', products: [], seo: {} });

        expect(await p).toBe(true);
    });

    it('una dirección anterior (la campaña cambió de nombre) lleva a la dirección actual', async () => {
        const p = firstValueFrom(preguntar('san-valentin-2026') as Observable<boolean | UrlTree>);
        ctrl.expectOne('/api/v1/campaigns/san-valentin-2026').flush({ slug: 'san-valentin-2027', name: 'San Valentín 2027', state: 'active', products: [], seo: {} });
        const r = await p;

        expect(r instanceof UrlTree).toBe(true);
        expect(TestBed.inject(Router).serializeUrl(r as UrlTree)).toBe('/san-valentin-2027');
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
