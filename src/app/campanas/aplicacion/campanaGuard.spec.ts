import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom } from 'rxjs';
import { UrlSegment } from '@angular/router';
import { API_URL } from '../../core/configuracion/api';
import { campanaGuard } from './campanaGuard';

describe('campanaGuard (¿esta dirección es una campaña?)', () => {
    let ctrl: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
        ctrl = TestBed.inject(HttpTestingController);
    });

    const preguntar = (...tramos: string[]) =>
        TestBed.runInInjectionContext(() => campanaGuard({} as never, tramos.map(t => new UrlSegment(t, {})), {} as never)) as Observable<boolean> | boolean;

    it('deja pasar la dirección si Laravel conoce la campaña', async () => {
        const r = preguntar('navidad') as Observable<boolean>;
        const p = firstValueFrom(r);
        ctrl.expectOne('/api/v1/campaigns/navidad').flush({ slug: 'navidad', name: 'Navidad', products: [], seo: {}, related_category: {} });

        expect(await p).toBe(true);
    });

    it('si Laravel responde 404, la ruta no coincide y el router sigue con las categorías', async () => {
        const p = firstValueFrom(preguntar('amor') as Observable<boolean>);
        ctrl.expectOne('/api/v1/campaigns/amor').flush({ code: 'not_found', message: 'x' }, { status: 404, statusText: 'Not Found' });

        expect(await p).toBe(false);
    });

    it('si la API falla, tampoco coincide (la categoría mostrará su propio aviso)', async () => {
        const p = firstValueFrom(preguntar('amor') as Observable<boolean>);
        ctrl.expectOne('/api/v1/campaigns/amor').flush({ message: 'x' }, { status: 500, statusText: 'Error' });

        expect(await p).toBe(false);
    });

    it('solo las direcciones de un tramo pueden ser campañas', () => {
        expect(preguntar('amor', 'salud')).toBe(false);
        ctrl.expectNone(() => true);
    });
});
