import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { CategoriaService, IMAGEN_PENDIENTE } from './CategoriaService';

const precio = { currency: 'USD', base_cents: 2150, final_cents: 1935, discount_cents: 215, discount_percent: 10, badge: '10% OFF' };
const producto = (slug: string, extra = {}) => ({ sku: slug, slug, name: slug, image: null, price: precio, available: true, category: { slug: 'amor', name: 'Amor' }, subcategory: null, search_terms: [], ...extra });

describe('CategoriaService (API de Laravel)', () => {
    let servicio: CategoriaService;
    let ctrl: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
        servicio = TestBed.inject(CategoriaService);
        ctrl = TestBed.inject(HttpTestingController);
    });
    afterEach(() => ctrl.verify());

    it('las categorías se piden una sola vez y sin imagen usan la provisional', async () => {
        const a = firstValueFrom(servicio.categorias());
        ctrl.expectOne('/api/v1/categories').flush({ data: [{ slug: 'amor', name: 'Amor', url: '/amor', short_description: null, image: null, subcategories: [] }] });
        const lista = await a;
        const b = await firstValueFrom(servicio.categorias()); // sin nueva petición

        expect(lista[0]).toEqual({ slug: 'amor', name: 'Amor', url: '/amor', image: IMAGEN_PENDIENTE, description: '' });
        expect(b).toEqual(lista);
    });

    it('si la API falla no se guarda el error: la siguiente vez vuelve a pedir', async () => {
        const fallida = firstValueFrom(servicio.categorias()).catch(() => 'error');
        ctrl.expectOne('/api/v1/categories').flush({}, { status: 500, statusText: 'Error' });
        expect(await fallida).toBe('error');

        const otra = firstValueFrom(servicio.categorias());
        ctrl.expectOne('/api/v1/categories').flush({ data: [] });
        expect(await otra).toEqual([]);
    });

    it('una subcategoría se pide con ?subcategory=; 404 da null y otros errores se propagan', async () => {
        const ok = firstValueFrom(servicio.categoria('profesiones-y-hobbies', 'salud'));
        ctrl.expectOne('/api/v1/categories/profesiones-y-hobbies?subcategory=salud').flush({
            slug: 'profesiones-y-hobbies', name: 'Profesiones y Hobbies', headline: null, intro_html: null, hero: null, price_from_cents: null,
            subcategories: [], active_subcategory: 'salud', products: [producto('doctor')],
            seo: { title: null, description: null, canonical: 'https://jardindesele.com/profesiones-y-hobbies/salud', og_image: null },
        });
        const c = (await ok)!;
        expect(c.products[0].image).toBe(IMAGEN_PENDIENTE);
        expect(c.seo.title).toBe('Profesiones y Hobbies | Jardín de Sele');
        expect(c.price_from_cents).toBe(0);

        const noExiste = firstValueFrom(servicio.categoria('amor', 'x'));
        ctrl.expectOne('/api/v1/categories/amor?subcategory=x').flush({}, { status: 404, statusText: 'Not Found' });
        expect(await noExiste).toBeNull();

        const cae = firstValueFrom(servicio.categoria('amor')).catch(e => e.status);
        ctrl.expectOne('/api/v1/categories/amor').flush({}, { status: 500, statusText: 'Error' });
        expect(await cae).toBe(500);
    });

    it('la introducción en texto simple se escapa y cada párrafo queda en su etiqueta', async () => {
        const p = firstValueFrom(servicio.categoria('amor'));
        ctrl.expectOne('/api/v1/categories/amor').flush({
            slug: 'amor', name: 'Amor', headline: 'x', intro_html: 'Uno <b>dos</b> & tres\nlínea\n\nOtro párrafo', hero: { type: 'image', srcset: { '600': 'a-600', '1080': 'a-1080' } },
            price_from_cents: 100, subcategories: [], active_subcategory: null, products: [],
            seo: { title: 'T', description: 'D', canonical: 'c', og_image: 'o' },
        });
        const c = (await p)!;

        expect(c.intro_html).toBe('<p>Uno &lt;b&gt;dos&lt;/b&gt; &amp; tres<br>línea</p><p>Otro párrafo</p>');
        expect(c.hero).toEqual({ type: 'image', url: 'a-1080' });
    });

    it('todos los productos, favoritos (6) e índice de búsqueda salen de GET /products', async () => {
        const todos = firstValueFrom(servicio.categoria(null));
        ctrl.expectOne('/api/v1/products').flush({ data: [producto('a')] });
        expect((await todos)!.products.map(p => p.slug)).toEqual(['a']);

        const fav = firstValueFrom(servicio.favoritos());
        ctrl.expectOne('/api/v1/products?limit=6').flush({ data: [producto('b')] });
        expect((await fav).map(p => p.slug)).toEqual(['b']);

        const indice = firstValueFrom(servicio.indice());
        ctrl.expectOne('/api/v1/products').flush({ data: [producto('doctor', { search_terms: ['medico'], category: { slug: 'p', name: 'Profesiones' }, subcategory: { slug: 's', name: 'Salud' } })] });
        expect((await indice)[0].textos).toEqual(['doctor', 'medico', 'Profesiones', 'Salud']);
    });
});
