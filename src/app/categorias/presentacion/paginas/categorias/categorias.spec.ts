import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Categorias } from './categorias';
import { CategoriaService } from '../../../aplicacion/servicios/CategoriaService';

async function montar(categoria: string | null, subcategoria: string | null = null) {
    const params = subcategoria ? { subcategoria } : {};
    const data = categoria ? { categoria } : {};
    TestBed.configureTestingModule({
        imports: [Categorias],
        providers: [provideRouter([]), {
            provide: ActivatedRoute,
            useValue: { data: of(data), paramMap: of(convertToParamMap(params)), snapshot: { data, paramMap: convertToParamMap(params) } },
        }],
    });
    const fixture = TestBed.createComponent(Categorias);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
}

describe('CategoriaService (mock del contrato)', () => {
    const servicio = new CategoriaService();

    it('sin subcategoría trae todos los productos de la categoría', () => {
        const c = servicio.categoria('profesiones-y-hobbies')!;
        expect(c.products.map(p => p.slug).sort()).toEqual(['abogada', 'abogado', 'doctor', 'enfermera']);
        expect(c.subcategories.map(s => s.slug)).toEqual(['salud', 'administrativos', 'fuerza-publica', 'cocina-y-hobbies']);
    });

    it('con subcategoría solo trae esa pestaña', () => {
        const c = servicio.categoria('profesiones-y-hobbies', 'salud')!;
        expect(c.products.map(p => p.slug).sort()).toEqual(['doctor', 'enfermera']);
        expect(c.seo.canonical).toBe('https://jardindesele.com/profesiones-y-hobbies/salud');
    });

    it('categoría o subcategoría inexistente da null', () => {
        expect(servicio.categoria('inventada')).toBeNull();
        expect(servicio.categoria('amor', 'salud')).toBeNull();
    });

    it('el precio con descuento trae la insignia', () => {
        const p = servicio.categoria('amor')!.products[0];
        expect(p.price.badge).toBe(`${p.price.discount_percent}% OFF`);
    });
});

describe('Categorias (pantalla)', () => {
    it('/categorias muestra todas las tarjetas y productos', async () => {
        const html = await montar(null);
        expect(html.querySelectorAll('.tarjeta-cat').length).toBe(4);
        expect(html.querySelectorAll('.producto').length).toBeGreaterThan(5);
        expect(html.querySelector('.pestanas')).toBeNull();
    });

    it('/profesiones-y-hobbies/salud abre esa pestaña activa', async () => {
        const html = await montar('profesiones-y-hobbies', 'salud');
        expect(html.querySelector('.pestanas a.activa')?.textContent).toContain('Salud');
        expect(html.querySelectorAll('.producto').length).toBe(2);
    });

    it('/amor no tiene pestañas', async () => {
        const html = await montar('amor');
        expect(html.querySelector('.pestanas')).toBeNull();
        expect(html.querySelector('h1')?.textContent).toContain('Amor');
    });

    it('subcategoría inexistente muestra el 404', async () => {
        const html = await montar('amor', 'salud');
        expect(html.textContent).toContain('No encontramos esta página');
    });
});
