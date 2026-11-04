import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CategoriasInicio } from './categorias-inicio';

describe('CategoriasInicio (/categorias)', () => {
    async function montar() {
        TestBed.configureTestingModule({ imports: [CategoriasInicio], providers: [provideRouter([])] });
        const fixture = TestBed.createComponent(CategoriasInicio);
        await fixture.whenStable();
        return fixture.nativeElement as HTMLElement;
    }

    it('muestra el banner, las 4 categorías con su descripción y "Ver categoría"', async () => {
        const html = await montar();

        expect(html.querySelector('h1')?.textContent).toContain('Explora nuestros regalos');
        expect(html.querySelectorAll('.tarjeta').length).toBe(4);
        expect(html.textContent).toContain('Profesiones, oficios y pasiones.');
        expect(html.textContent).toContain('Ver categoría');
    });

    it('cada tarjeta lleva a su categoría', async () => {
        const html = await montar();
        const rutas = Array.from(html.querySelectorAll<HTMLAnchorElement>('.tarjeta')).map(a => a.getAttribute('href'));

        expect(rutas).toEqual(['/profesiones-y-hobbies', '/amor', '/amistad', '/familia']);
    });

    it('incluye "¿Cómo funciona?" y la fila de confianza', async () => {
        const html = await montar();

        expect(html.textContent).toContain('¿Cómo funciona?');
        expect(html.textContent).toContain('Hecho en Guayaquil');
        expect(html.textContent).toContain('Envíos por Servientrega');
        expect(html.textContent).toContain('Pago seguro');
    });
});
