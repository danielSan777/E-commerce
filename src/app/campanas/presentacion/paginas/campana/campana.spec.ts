import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { productoListadoApi } from '../../../../testing/catalogo-api';
import { Campana } from './campana';

const esperar = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));

const campanaApi = (state: 'active' | 'upcoming', extra = {}) => ({
    slug: 'san-valentin', name: 'San Valentín', state, season_year: state === 'active' ? 2027 : 2028, event_date: '2027-02-14',
    order_deadline: null, tagline: 'Un regalo con su nombre que sigue creciendo', slogan: 'Las flores duran una semana. Esta maceta, años.',
    related_category: { slug: 'amor', name: 'Amor', url: '/amor' },
    products: ['bob', 'homero', 'doctor'].map(s => productoListadoApi(s)),
    seo: { title: null, description: null, canonical: 'https://jardindesele.com/san-valentin', og_image: null }, ...extra,
});

/** Monta /{slug} y responde como Laravel. `respuesta` null = 404; un número = ese error. */
async function montar(slug: string, respuesta: object | number | null) {
    TestBed.configureTestingModule({
        imports: [Campana],
        providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' },
            { provide: ActivatedRoute, useValue: { snapshot: { data: { campana: slug } } } }],
    });
    const ctrl = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Campana);
    fixture.detectChanges();
    const peticion = ctrl.expectOne(`/api/v1/campaigns/${slug}`);
    if (typeof respuesta === 'number') peticion.flush({ message: 'x' }, { status: respuesta, statusText: 'Error' });
    else if (respuesta === null) peticion.flush({ code: 'not_found', message: 'No existe' }, { status: 404, statusText: 'Not Found' });
    else peticion.flush(respuesta);
    await esperar();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
}

describe('Campana (/san-valentin con datos de Laravel)', () => {
    it('en temporada: título, lema, 3 regalos, "Personalizar" hacia el personalizador y sin fecha límite si Laravel no la informa', async () => {
        const html = await montar('san-valentin', campanaApi('active'));

        expect(html.querySelector('h1')?.textContent).toContain('San Valentín');
        expect(html.textContent).toContain('Un regalo con su nombre que sigue creciendo');
        expect(html.querySelector('.fecha')).toBeNull();
        expect(html.querySelectorAll('.producto').length).toBe(3);
        expect(html.querySelector('.personalizar')?.getAttribute('href')).toBe('/producto/bob/personalizar');
        expect(html.textContent).toContain('Las flores duran una semana. Esta maceta, años.');
        expect(html.textContent).toContain('Ver más regalos de Amor');
    });

    it('si Laravel informa la fecha límite, se muestra', async () => {
        const html = await montar('san-valentin', campanaApi('active', { order_deadline: { date: '2027-02-09', label: 'Pide hasta el martes 9' } }));

        expect(html.querySelector('.fecha')?.textContent).toContain('Pide hasta el martes 9');
    });

    it('fuera de temporada responde con "San Valentín 2028 llegará muy pronto" y regalos de Amor', async () => {
        const html = await montar('san-valentin', campanaApi('upcoming'));

        expect(html.querySelector('h1')?.textContent).toContain('San Valentín 2028');
        expect(html.textContent).toContain('llegará muy pronto');
        expect(html.querySelector('.hero a.boton')?.getAttribute('href')).toBe('/amor');
        expect(html.querySelector('.promesa')).toBeNull();
    });

    it('una campaña que Laravel no encuentra muestra el 404', async () => {
        const html = await montar('dia-de-la-madre', null);

        expect(html.textContent).toContain('No encontramos esta página');
    });

    it('si la API falla pide intentar de nuevo, sin decir que no existe', async () => {
        const html = await montar('san-valentin', 500);

        expect(html.textContent).toContain('No pudimos cargar esta página');
        expect(html.textContent).not.toContain('No encontramos esta página');
    });
});
