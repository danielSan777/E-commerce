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

    it('la insignia solo existe cuando hay descuento (y sin descuento no hay precio tachado)', () => {
        for (const p of servicio.categoria('amor')!.products) {
            expect(p.price.badge).toBe(p.price.discount_percent > 0 ? `${p.price.discount_percent}% OFF` : null);
            expect(p.price.base_cents).toBeGreaterThanOrEqual(p.price.final_cents);
        }
    });
});

describe('Categorias (pantalla de una categoría)', () => {
    it('/profesiones-y-hobbies/salud abre esa pestaña con su texto y sus 2 productos', async () => {
        const html = await montar('profesiones-y-hobbies', 'salud');
        expect(html.querySelector('.pestanas a.activa')?.textContent).toContain('Salud');
        expect(html.querySelector('.sub-cabecera')?.textContent).toContain('Detalles únicos para quienes cuidan y dan bienestar.');
        expect(html.querySelectorAll('.producto').length).toBe(2);
    });

    it('cada producto tiene el botón "Personalizar" hacia la ficha abierta en el personalizador', async () => {
        const html = await montar('profesiones-y-hobbies', 'salud');
        const enlaces = Array.from(html.querySelectorAll<HTMLAnchorElement>('.personalizar')).map(a => a.getAttribute('href'));
        expect(enlaces.sort()).toEqual(['/producto/doctor/personalizar', '/producto/enfermera/personalizar']);
    });

    it('muestra la ruta Inicio / Categorías / nombre y las otras 3 categorías', async () => {
        const html = await montar('profesiones-y-hobbies');
        expect(html.querySelector('.migas')?.textContent).toContain('Categorías');
        expect(html.querySelectorAll('.otras li').length).toBe(3);
        expect(html.querySelector('.otras')?.textContent).not.toContain('Profesiones y Hobbies');
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
