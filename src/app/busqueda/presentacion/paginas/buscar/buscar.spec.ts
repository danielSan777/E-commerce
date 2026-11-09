import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { productoListadoApi } from '../../../../testing/catalogo-api';
import { Buscar } from './buscar';

const PROFESIONES = { category: { slug: 'profesiones-y-hobbies', name: 'Profesiones y Hobbies' }, subcategory: { slug: 'salud', name: 'Salud' } };
const INDICE = [
    productoListadoApi('doctor', 'Doctor', { ...PROFESIONES, search_terms: ['medico'] }),
    productoListadoApi('enfermera', 'Enfermera', PROFESIONES),
    productoListadoApi('bob', 'Bob corazón'),
];

// El índice y los favoritos llegan de Laravel: se responden antes de mirar la pantalla.
async function montar(q: string | null) {
    TestBed.configureTestingModule({
        imports: [Buscar],
        providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }, {
            provide: ActivatedRoute,
            useValue: { snapshot: { queryParamMap: convertToParamMap(q ? { q } : {}) } },
        }],
    });
    const ctrl = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Buscar);
    ctrl.expectOne('/api/v1/products').flush({ data: INDICE });
    ctrl.expectOne('/api/v1/products?limit=6').flush({ data: INDICE.slice(0, 2) });
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, html: fixture.nativeElement as HTMLElement };
}

describe('Buscar (/buscar)', () => {
    it('"medico" encuentra a Doctor aunque no lleve tilde', async () => {
        const { html } = await montar('medico');
        expect(html.textContent).toContain('Doctor');
        expect(html.textContent).toContain('1 resultado');
    });

    it('"salud" (categoría y subcategoría) encuentra doctor y enfermera', async () => {
        const { html } = await montar('SALUD');
        expect(html.textContent).toContain('2 resultados');
    });

    it('sin resultados: favoritos, "Explora nuestras categorías" y WhatsApp con lo buscado', async () => {
        const { html } = await montar('astronauta');
        expect(html.textContent).toContain('No encontramos «astronauta»');
        expect(html.textContent).toContain('Mira estos favoritos');
        expect(html.querySelector('a[href="/categorias"]')?.textContent).toContain('Explora nuestras categorías');
        const wa = html.querySelector('a.btn-whatsapp') as HTMLAnchorElement;
        expect(decodeURIComponent(wa.href)).toContain('astronauta');
    });

    it('sin término muestra los favoritos que entrega Laravel', async () => {
        const { html } = await montar(null);
        expect(html.textContent).toContain('Nuestros favoritos');
        expect(html.textContent).toContain('Enfermera');
    });
});
