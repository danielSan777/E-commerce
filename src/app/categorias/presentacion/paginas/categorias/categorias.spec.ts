import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { API_URL } from '../../../../core/configuracion/api';
import { Categorias } from './categorias';

const esperar = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));
const precio = (base: number, final = base) => ({
    currency: 'USD', base_cents: base, final_cents: final, discount_cents: base - final, discount_percent: base > final ? 10 : 0,
    badge: base > final ? '10% OFF' : null,
});
const producto = (slug: string, name: string, extra = {}) => ({ sku: `JDS-${slug}`, slug, name, image: `http://api/media/${slug}.webp`, price: precio(2150), available: true, ...extra });
const RESUMEN = [
    { slug: 'profesiones-y-hobbies', name: 'Profesiones y Hobbies', url: '/profesiones-y-hobbies', short_description: 'Para quien ama lo que hace', image: 'http://api/media/p.webp', subcategories: [] },
    { slug: 'amor', name: 'Amor', url: '/amor', short_description: null, image: null, subcategories: [] },
    { slug: 'amistad', name: 'Amistad', url: '/amistad', short_description: null, image: null, subcategories: [] },
    { slug: 'familia', name: 'Familia', url: '/familia', short_description: null, image: null, subcategories: [] },
];
const SUBS = [
    { slug: 'salud', name: 'Salud', url: '/profesiones-y-hobbies/salud' },
    { slug: 'administrativos', name: 'Administrativos', url: '/profesiones-y-hobbies/administrativos' },
];
const categoriaApi = (slug: string, name: string, extra = {}) => ({
    slug, name, headline: 'Un detalle para quien ama lo que hace', intro_html: 'Regalos para cada profesión.\n\nHechos a mano.', hero: null,
    price_from_cents: 1935, subcategories: [], active_subcategory: null, products: [],
    seo: { title: `${name} | Jardín de Sele`, description: null, canonical: `https://jardindesele.com/${slug}`, og_image: null }, ...extra,
});

/** Monta la pantalla y responde a la API como lo haría Laravel. `respuesta` null = 404; un número = ese error. */
async function montar(categoria: string | null, subcategoria: string | null, respuesta: object | number | null, ruta = 'param') {
    const params = { ...(subcategoria ? { subcategoria } : {}), ...(ruta === 'param' && categoria ? { categoria } : {}) };
    const data = ruta === 'data' && categoria ? { categoria } : {};
    TestBed.configureTestingModule({
        imports: [Categorias],
        providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }, {
            provide: ActivatedRoute,
            useValue: { data: of(data), paramMap: of(convertToParamMap(params)), snapshot: { data, paramMap: convertToParamMap(params) } },
        }],
    });
    const ctrl = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Categorias);
    fixture.detectChanges();
    await esperar();
    ctrl.expectOne('/api/v1/categories').flush({ data: RESUMEN });
    const consulta = subcategoria ? `?subcategory=${subcategoria}` : '';
    const peticion = ctrl.expectOne(`/api/v1/categories/${categoria}${consulta}`);
    if (typeof respuesta === 'number') peticion.flush({ message: 'x' }, { status: respuesta, statusText: 'Error' });
    else if (respuesta === null) peticion.flush({ code: 'not_found', message: 'No existe' }, { status: 404, statusText: 'Not Found' });
    else peticion.flush(respuesta);
    await esperar();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
}

describe('Categorias (pantalla de una categoría con datos de Laravel)', () => {
    it('/profesiones-y-hobbies/salud abre esa pestaña y muestra sus productos con el precio que calculó Laravel', async () => {
        const html = await montar('profesiones-y-hobbies', 'salud', categoriaApi('profesiones-y-hobbies', 'Profesiones y Hobbies', {
            subcategories: SUBS, active_subcategory: 'salud',
            products: [producto('doctor', 'Doctor', { price: precio(2500, 2250) }), producto('enfermera', 'Enfermera')],
        }));

        expect(html.querySelector('.pestanas a.activa')?.textContent).toContain('Salud');
        expect(html.querySelectorAll('.producto').length).toBe(2);
        const doctor = html.querySelector('.producto')!;
        expect(doctor.textContent).toContain('$22.50');
        expect(doctor.querySelector('s')?.textContent).toContain('$25.00');
        expect(doctor.querySelector('.badge')?.textContent).toContain('10% OFF');
        expect(html.querySelector('.datos')?.textContent).toContain('Desde $19.35');
    });

    it('cada producto tiene el botón "Personalizar" hacia la ficha abierta en el personalizador', async () => {
        const html = await montar('amor', null, categoriaApi('amor', 'Amor', { products: [producto('bob', 'Bob'), producto('homero', 'Homero')] }));
        const enlaces = Array.from(html.querySelectorAll<HTMLAnchorElement>('.personalizar')).map(a => a.getAttribute('href'));

        expect(enlaces.sort()).toEqual(['/producto/bob/personalizar', '/producto/homero/personalizar']);
    });

    it('muestra la ruta Inicio / Categorías / nombre y las otras 3 categorías', async () => {
        const html = await montar('profesiones-y-hobbies', null, categoriaApi('profesiones-y-hobbies', 'Profesiones y Hobbies'));

        expect(html.querySelector('.migas')?.textContent).toContain('Categorías');
        expect(html.querySelectorAll('.otras li').length).toBe(3);
        expect(html.querySelector('.otras')?.textContent).not.toContain('Profesiones y Hobbies');
    });

    it('sin subcategorías no hay pestañas, y la introducción se muestra como párrafos', async () => {
        const html = await montar('amor', null, categoriaApi('amor', 'Amor'));

        expect(html.querySelector('.pestanas')).toBeNull();
        expect(html.querySelector('h1')?.textContent).toContain('Amor');
        expect(html.querySelectorAll('.intro p').length).toBe(2);
    });

    it('la dirección puede venir de los datos de la ruta o del parámetro (categorías nuevas sin cambiar código)', async () => {
        const html = await montar('familia', null, categoriaApi('familia', 'Familia'), 'data');

        expect(html.querySelector('h1')?.textContent).toContain('Familia');
    });

    it('categoría o subcategoría que Laravel no encuentra muestra el 404', async () => {
        const html = await montar('amor', 'salud', null);

        expect(html.textContent).toContain('No encontramos esta página');
    });

    it('si la API falla no dice "no existe": pide intentar de nuevo', async () => {
        const html = await montar('amor', null, 500);

        expect(html.textContent).toContain('No pudimos cargar esta página');
        expect(html.textContent).not.toContain('No encontramos esta página');
    });
});
