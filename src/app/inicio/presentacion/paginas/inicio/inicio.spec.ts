import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Inicio } from './inicio';

describe('Inicio (/)', () => {
    async function montar() {
        TestBed.configureTestingModule({ imports: [Inicio], providers: [provideRouter([])] });
        const fixture = TestBed.createComponent(Inicio);
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
