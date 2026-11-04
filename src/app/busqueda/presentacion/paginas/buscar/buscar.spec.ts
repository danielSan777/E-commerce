import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Buscar } from './buscar';

async function montar(q: string | null) {
    TestBed.configureTestingModule({
        imports: [Buscar],
        providers: [provideRouter([]), {
            provide: ActivatedRoute,
            useValue: { snapshot: { queryParamMap: convertToParamMap(q ? { q } : {}) } },
        }],
    });
    const fixture = TestBed.createComponent(Buscar);
    await fixture.whenStable();
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

    it('sin término muestra los favoritos', async () => {
        const { html } = await montar(null);
        expect(html.textContent).toContain('Nuestros favoritos');
    });
});
