import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Politica } from './politica';

async function montar(slug: string) {
    TestBed.configureTestingModule({
        imports: [Politica],
        providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { data: { politica: slug } } } }],
    });
    const f = TestBed.createComponent(Politica);
    await f.whenStable();
    return f.nativeElement as HTMLElement;
}

describe('Politica', () => {
    it('muestra el título y, sin texto aprobado, un aviso claro (sin inventar texto legal)', async () => {
        const html = await montar('terminos');

        expect(html.querySelector('h1')?.textContent).toContain('Términos y condiciones');
        expect(html.querySelector('.pendiente')).not.toBeNull();
    });

    it('enlaza a las otras tres políticas', async () => {
        const html = await montar('privacidad');

        expect(Array.from(html.querySelectorAll('.otras a')).map(a => a.getAttribute('href')))
            .toEqual(['/terminos-y-condiciones', '/politicas-de-envio', '/cambios-de-productos-personalizados']);
    });

    it('una política desconocida muestra el 404', async () => {
        expect((await montar('otra')).textContent).toContain('No encontramos esta página');
    });
});
