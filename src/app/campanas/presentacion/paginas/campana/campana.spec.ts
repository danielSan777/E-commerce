import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Campana } from './campana';
import { CampanaService } from '../../../aplicacion/servicios/CampanaService';
import { CampanaContrato } from '../../../dominio/interfaces/campana';

async function montar(slug: string, estado?: CampanaContrato['state']) {
    TestBed.configureTestingModule({
        imports: [Campana],
        providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { data: { campana: slug } } } }],
    });
    if (estado) {
        const servicio = TestBed.inject(CampanaService);
        const original = servicio.campana.bind(servicio);
        servicio.campana = (s: string) => {
            const c = original(s);
            return c ? { ...c, state: estado } : c;
        };
    }
    const fixture = TestBed.createComponent(Campana);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
}

describe('Campana (/san-valentin)', () => {
    it('en temporada: título, lema, fecha límite, 6 regalos y "Personalizar" hacia el personalizador', async () => {
        const html = await montar('san-valentin');

        expect(html.querySelector('h1')?.textContent).toContain('San Valentín');
        expect(html.textContent).toContain('Un regalo con su nombre que sigue creciendo');
        expect(html.textContent).toContain('Pide hasta el martes 9 para recibir antes del 14 de febrero');
        expect(html.querySelectorAll('.producto').length).toBe(6);
        expect(html.querySelector('.personalizar')?.getAttribute('href')).toMatch(/^\/producto\/.+\/personalizar$/);
        expect(html.textContent).toContain('Las flores duran una semana. Esta maceta, años.');
        expect(html.textContent).toContain('Ver más regalos de Amor');
    });

    it('fuera de temporada responde con "San Valentín 2027 llegará muy pronto" y regalos de Amor', async () => {
        const html = await montar('san-valentin', 'upcoming');

        expect(html.querySelector('h1')?.textContent).toContain('San Valentín 2027');
        expect(html.textContent).toContain('llegará muy pronto');
        expect(html.querySelector('.hero a.boton')?.getAttribute('href')).toBe('/amor');
        expect(html.querySelector('.promesa')).toBeNull();
    });

    it('una campaña desconocida muestra el 404', async () => {
        const html = await montar('dia-de-la-madre');

        expect(html.textContent).toContain('No encontramos esta página');
    });
});
