import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../../core/configuracion/api';
import { RESUMEN_CATEGORIAS_API } from '../../../../testing/catalogo-api';
import { provideRouter } from '@angular/router';
import { CategoriasInicio } from './categorias-inicio';

describe('CategoriasInicio (/categorias)', () => {
    async function montar(encabezado: object = { title: null, subtitle: null, items: [] }) {
        TestBed.configureTestingModule({ imports: [CategoriasInicio], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
        const fixture = TestBed.createComponent(CategoriasInicio);
        const ctrl = TestBed.inject(HttpTestingController);
        ctrl.expectOne('/api/v1/categories').flush({ data: RESUMEN_CATEGORIAS_API });
        ctrl.expectOne('/api/v1/categories-page').flush(encabezado);
        await fixture.whenStable();
        fixture.detectChanges();
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

    it('sin nada elegido en el panel se ven los textos y las fotos de las categorías de siempre', async () => {
        const html = await montar();
        expect(html.querySelector('h1')?.textContent).toContain('Explora nuestros regalos');
        expect(html.querySelectorAll('.banner-imagenes img').length).toBe(3);
        expect(html.querySelector('.banner-video')).toBeNull();
    });

    it('muestra el título, el subtítulo y la imagen que eligió el administrador', async () => {
        const html = await montar({ title: 'Mira estos regalos', subtitle: 'Elige uno', items: [{ type: 'image', alt: 'Regalos', srcset: { '1080': 'http://api/r-1080.webp' } }] });
        expect(html.querySelector('h1')?.textContent).toBe('Mira estos regalos');
        expect(html.querySelector('.banner p')?.textContent).toBe('Elige uno');
        expect((html.querySelector('img.banner-imagen') as HTMLImageElement).getAttribute('src')).toBe('http://api/r-1080.webp');
        expect(html.querySelector('.banner-imagenes')).toBeNull(); // ya no salen las fotos de las categorías
    });

    it('con varios videos no van en bucle: al terminar uno pasa al siguiente', async () => {
        const v = (n: number) => ({ type: 'video', url: `http://api/v${n}.mp4`, poster: null, duration_s: 9 });
        const fixture = (await montar({ title: null, subtitle: null, items: [v(1), v(2)] }));
        const video = () => fixture.querySelector('video.banner-video') as HTMLVideoElement;
        expect(video().getAttribute('src')).toBe('http://api/v1.mp4');
        expect(video().loop).toBe(false);
        video().dispatchEvent(new Event('ended'));
        TestBed.tick();
        expect(video().getAttribute('src')).toBe('http://api/v2.mp4');
    });

    it('mientras carga el encabezado no se ven los textos ni las fotos de siempre (sin parpadeo)', () => {
        TestBed.configureTestingModule({ imports: [CategoriasInicio], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
        const fixture = TestBed.createComponent(CategoriasInicio);
        fixture.detectChanges();
        const html = fixture.nativeElement as HTMLElement;
        expect(html.querySelector('h1')).toBeNull();
        expect(html.querySelector('.banner-imagenes')).toBeNull();
    });
});
