import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../../core/configuracion/api';
import { RESUMEN_CATEGORIAS_API, productoListadoApi } from '../../../../testing/catalogo-api';
import { provideRouter } from '@angular/router';
import { Inicio } from './inicio';

describe('Inicio (/)', () => {
    const NAVIDAD = {
        slug: 'navidad', name: 'Navidad', state: 'active', closing_message: null, url: '/navidad', season_year: 2026, event_date: '2026-12-25',
        tagline: 'Un regalo que crece', slogan: 'Regala vida', theme: { color: '#1b5e20', emoji: '🎄', cover: null, video: null },
    };

    /** `campana`: lo que Laravel responde en /campaigns/current (null = hoy no hay campaña en temporada). */
    async function montar(campana: object | null = null, portada: object | object[] | null = null) {
        TestBed.configureTestingModule({ imports: [Inicio], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
        const ctrl = TestBed.inject(HttpTestingController);
        const fixture = TestBed.createComponent(Inicio);
        ctrl.expectOne('/api/v1/categories').flush({ data: RESUMEN_CATEGORIAS_API });
        ctrl.expectOne('/api/v1/campaigns/current').flush({ data: campana });
        const items = Array.isArray(portada) ? portada : portada ? [portada] : [];
        ctrl.expectOne('/api/v1/home/hero').flush({ data: items[0] ?? null, items });
        ctrl.expectOne('/api/v1/products?limit=6').flush({ data: ['a', 'b', 'c', 'd', 'e', 'f'].map(s => productoListadoApi(s)) });
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

    it('sin portada ni video muestra la imagen', async () => {
        const html = await montar();

        expect(html.querySelector('video')).toBeNull();
        expect(html.querySelector('img.hero-medio')).not.toBeNull();
    });

    it('sin portada del administrador usa la imagen de siempre', async () => {
        const html = await montar();

        expect((html.querySelector('img.hero-medio') as HTMLImageElement).getAttribute('src')).toBe('imagenes/doctor3D.png');
    });

    it('con una imagen elegida en el panel, reemplaza a la foto de ejemplo', async () => {
        const html = await montar(null, { type: 'image', alt: 'Macetas', w: 1500, h: 1000, srcset: { '600': 'http://api/media/home/a-600.webp', '1080': 'http://api/media/home/a-1080.webp' } });
        const img = html.querySelector('img.hero-medio') as HTMLImageElement;

        expect(img.getAttribute('src')).toBe('http://api/media/home/a-1080.webp');
        expect(img.getAttribute('alt')).toBe('Macetas');
        expect(html.querySelector('video')).toBeNull();
    });

    it('con un video elegido en el panel lo muestra silenciado y en bucle, con su portada', async () => {
        const html = await montar(null, { type: 'video', url: 'http://api/media/home/v.mp4', poster: 'http://api/media/home/v-portada.webp', duration_s: 30 });
        const video = html.querySelector('.hero video.hero-medio') as HTMLVideoElement;

        expect(video).not.toBeNull();
        expect(video.getAttribute('src')).toBe('http://api/media/home/v.mp4');
        expect(video.getAttribute('poster')).toBe('http://api/media/home/v-portada.webp');
        expect(video.muted).toBe(true);
        expect(video.loop).toBe(true);
        expect(video.hasAttribute('autoplay')).toBe(false); // lo reproduce la directiva solo cuando se ve
        expect(html.querySelector('img.hero-medio')).toBeNull();
        // el botón y el texto siguen encima del video
        expect(html.querySelector('.hero a.boton')?.textContent).toContain('Encuentra tu detalle perfecto');
    });

    it('con varios videos no van en bucle: al terminar uno pasa al siguiente y hay puntos para elegir', async () => {
        const v = (n: number) => ({ type: 'video', url: `http://api/media/home/v${n}.mp4`, poster: null, duration_s: 10 });
        const html = await montar(null, [v(1), v(2), v(3)]);
        const video = () => html.querySelector('.hero video.hero-medio') as HTMLVideoElement;
        expect(video().getAttribute('src')).toBe('http://api/media/home/v1.mp4');
        expect(video().loop).toBe(false);
        expect(html.querySelectorAll('.hero-puntos button')).toHaveLength(3);

        video().dispatchEvent(new Event('ended'));
        TestBed.tick();
        expect(video().getAttribute('src')).toBe('http://api/media/home/v2.mp4');

        (html.querySelectorAll('.hero-puntos button')[2] as HTMLButtonElement).click();
        TestBed.tick();
        expect(video().getAttribute('src')).toBe('http://api/media/home/v3.mp4');
        video().dispatchEvent(new Event('ended')); // después del último vuelve al primero
        TestBed.tick();
        expect(video().getAttribute('src')).toBe('http://api/media/home/v1.mp4');
    });

    it('mezcla imágenes y videos en el orden del panel; con una sola no hay puntos', async () => {
        const foto = { type: 'image', alt: 'Maceta', w: 800, h: 800, srcset: { '600': 'http://api/m-600.webp', '1080': 'http://api/m-1080.webp' } };
        const html = await montar(null, [foto, { type: 'video', url: 'http://api/v.mp4', poster: null, duration_s: 5 }]);
        expect((html.querySelector('img.hero-medio') as HTMLImageElement).getAttribute('src')).toBe('http://api/m-1080.webp');
        expect(html.querySelectorAll('.hero-puntos button')).toHaveLength(2);
    });

    it('nunca hay dos medios a la vez en la portada (ni la imagen de siempre junto al video)', async () => {
        const html = await montar(null, { type: 'video', url: 'http://api/v.mp4', poster: 'http://api/p.webp', duration_s: 5 });
        expect(html.querySelectorAll('.hero .hero-medio')).toHaveLength(1);
    });

    it('mientras carga la portada no se muestra la imagen de siempre (evita el parpadeo del doctor)', async () => {
        TestBed.configureTestingModule({ imports: [Inicio], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
        const fixture = TestBed.createComponent(Inicio);
        fixture.detectChanges();
        expect((fixture.nativeElement as HTMLElement).querySelector('.hero-medio')).toBeNull();
        const ctrl = TestBed.inject(HttpTestingController);
        ctrl.expectOne('/api/v1/home/hero').flush({ data: { type: 'video', url: 'http://api/v.mp4', poster: null, duration_s: 5 }, items: [{ type: 'video', url: 'http://api/v.mp4', poster: null, duration_s: 5 }] });
        fixture.detectChanges();
        expect((fixture.nativeElement as HTMLElement).querySelectorAll('.hero-medio')).toHaveLength(1);
        expect((fixture.nativeElement as HTMLElement).querySelector('img.hero-medio')).toBeNull();
    });

    it('con una sola portada no hay puntos', async () => {
        const una = await montar(null, { type: 'image', alt: 'Maceta', w: 800, h: 800, srcset: { '1080': 'http://api/m-1080.webp' } });
        expect(una.querySelector('.hero-puntos')).toBeNull();
    });

    it('sin campaña en temporada no muestra el banner', async () => {
        const html = await montar(null);

        expect(html.querySelector('.campana')).toBeNull();
    });

    it('con campaña en temporada muestra el banner con su nombre, lema, emoji, color y enlace', async () => {
        const html = await montar(NAVIDAD);
        const banner = html.querySelector('.campana') as HTMLElement;

        expect(banner.textContent).toContain('Navidad');
        expect(banner.textContent).toContain('🎄');
        expect(banner.querySelector('h2')?.textContent).toContain('Un regalo que crece');
        expect(banner.querySelector('a')?.getAttribute('href')).toBe('/navidad');
        expect(banner.style.getPropertyValue('--campana')).toBe('#1b5e20');
    });

    it('si el color no es un #RRGGBB válido, el banner usa el color de la tienda', async () => {
        const html = await montar({ ...NAVIDAD, theme: { color: 'url(javascript:x)', emoji: null, cover: null, video: null } });

        expect((html.querySelector('.campana') as HTMLElement).style.getPropertyValue('--campana')).toBe('');
    });

    it('con portada la muestra en el banner', async () => {
        const html = await montar({ ...NAVIDAD, theme: { color: null, emoji: null, cover: { alt: 'Pino', w: 1200, h: 1200, srcset: { '600': 'http://x/p-600.webp', '1080': 'http://x/p-1080.webp' } }, video: null } });

        const img = html.querySelector('.campana-portada') as HTMLImageElement;
        expect(img.getAttribute('src')).toBe('http://x/p-600.webp');
        expect(img.getAttribute('alt')).toBe('Pino');
    });

    it('con video de portada muestra el video en el banner', async () => {
        const html = await montar({ ...NAVIDAD, theme: { color: null, emoji: null, cover: null, video: { url: 'http://x/v.mp4', poster: 'http://x/p.webp', duration_s: 30 } } });

        const video = html.querySelector('.campana video.campana-portada') as HTMLVideoElement;
        expect(video.getAttribute('src')).toBe('http://x/v.mp4');
        expect(html.querySelector('.campana img.campana-portada')).toBeNull();
    });

    it('al terminar la campaña muestra el mensaje de cierre y no el botón', async () => {
        const html = await montar({ ...NAVIDAD, state: 'closing', closing_message: 'Navidad regresará pronto', tagline: null, slogan: null });
        const banner = html.querySelector('.campana') as HTMLElement;

        expect(banner.querySelector('h2')?.textContent).toContain('Navidad regresará pronto');
        expect(banner.querySelector('a')).toBeNull();
        expect(banner.classList).toContain('cierre');
    });
});
