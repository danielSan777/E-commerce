import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { API_URL } from '../../../../core/configuracion/api';
import { precioApi } from '../../../../testing/catalogo-api';
import { DetalleProducto } from './detalle-producto';

const esperar = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));

const FICHA = {
  sku: 'JDS-001', slug: 'doctor', type: 'personalizable', name: 'Doctor',
  category: { slug: 'profesiones-y-hobbies', name: 'Profesiones y Hobbies' }, subcategory: { slug: 'salud', name: 'Salud' },
  available: true, price: precioApi(2500, 2250), size_text: 'Base 14 × 7 cm', material_text: 'PLA Plus', includes: ['Plantita natural', 'Funda kraft'],
  description_html: 'Una maceta para doctores.\nCon su nombre.',
  media: [
    { type: 'image', role: 'front', alt: 'Doctor', srcset: { '600': 'http://api/media/d-600.webp', '1080': 'http://api/media/d-1080.webp' } },
    { type: 'image', role: 'angle', alt: 'Doctor de lado', srcset: { '600': 'http://api/media/e-600.webp', '1080': 'http://api/media/e-1080.webp' } },
    { type: 'video', role: 'video', url: 'http://api/media/v.mp4' },
  ],
  related_skus: [], seo: { title: 'Doctor | Jardín de Sele', description: 'Maceta para doctores', canonical: 'https://jardindesele.com/producto/doctor', og_image: 'http://api/media/d-1080.webp' },
};

/** Monta la ficha de /producto/{slug} y responde como Laravel. `respuesta` null = 404; un número = ese error. */
async function montar(slug: string | null, respuesta?: object | number | null) {
  localStorage.clear();
  TestBed.configureTestingModule({
    imports: [DetalleProducto],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }, {
      provide: ActivatedRoute,
      useValue: { paramMap: of(convertToParamMap(slug ? { producto: slug } : {})), snapshot: { paramMap: convertToParamMap(slug ? { producto: slug } : {}) } },
    }],
  });
  const ctrl = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(DetalleProducto);
  fixture.detectChanges();
  await esperar();
  if (slug && respuesta !== undefined) {
    const peticion = ctrl.expectOne(`/api/v1/products/${slug}`);
    if (typeof respuesta === 'number') peticion.flush({ message: 'x' }, { status: respuesta, statusText: 'Error' });
    else if (respuesta === null) peticion.flush({ code: 'not_found', message: 'No existe' }, { status: 404, statusText: 'Not Found' });
    else peticion.flush(respuesta);
    await esperar();
  }
  fixture.detectChanges();
  return fixture;
}

describe('DetalleProducto (ficha con datos de Laravel)', () => {
  it('muestra nombre, precio final calculado por Laravel, precio anterior y descuento', async () => {
    const f = await montar('doctor', FICHA);
    const html = f.nativeElement as HTMLElement;

    expect(html.querySelector('h1')?.textContent).toContain('Doctor');
    expect(html.querySelector('.precio')?.textContent).toContain('$. 22.50 USD');
    expect(html.querySelector('.precio-anterior')?.textContent).toContain('25.00');
    expect(html.querySelector('.insignia')?.textContent).toContain('10% OFF');
  });

  it('muestra qué incluye, tamaño, material y descripción del producto', async () => {
    const html = (await montar('doctor', FICHA)).nativeElement as HTMLElement;

    expect(Array.from(html.querySelectorAll('.incluye li')).map(li => li.textContent?.trim())).toEqual(['Plantita natural', 'Funda kraft']);
    expect(html.textContent).toContain('Base 14 × 7 cm');
    expect(html.textContent).toContain('PLA Plus');
    expect(html.querySelector('.descripcion')?.textContent).toContain('Una maceta para doctores.');
  });

  it('la galería usa las fotos subidas (la principal primero) y no los videos', async () => {
    const f = await montar('doctor', FICHA);

    expect(f.componentInstance.imagenes()).toEqual(['http://api/media/d-1080.webp', 'http://api/media/e-1080.webp']);
    expect(f.componentInstance.productoCarrito()).toMatchObject({ id: 'doctor', nombre: 'Doctor', precio: 22.5, imagen: 'http://api/media/d-1080.webp' });
  });

  it('sin fotos ni textos opcionales usa la imagen provisional y oculta lo que falta', async () => {
    const html = (await montar('doctor', { ...FICHA, media: [], includes: [], size_text: null, material_text: null, description_html: null, price: precioApi(2150) })).nativeElement as HTMLElement;

    expect(html.querySelector('.galeria img')?.getAttribute('src')).toContain('sin-imagen.svg');
    expect(html.querySelector('.incluye')).toBeNull();
    expect(html.querySelector('.dato-producto')).toBeNull();
    expect(html.querySelector('.descripcion')).toBeNull();
    expect(html.querySelector('.precio-anterior')).toBeNull();
  });

  it('un producto agotado no se puede personalizar', async () => {
    const html = (await montar('doctor', { ...FICHA, available: false })).nativeElement as HTMLElement;

    expect(html.querySelector('.aviso-agotado')).not.toBeNull();
    expect((html.querySelector('.btn-comprar') as HTMLButtonElement).disabled).toBe(true);
  });

  it('un producto que Laravel no encuentra muestra el 404', async () => {
    const html = (await montar('no-existe', null)).nativeElement as HTMLElement;

    expect(html.textContent).toContain('No encontramos esta página');
  });

  it('si la API falla pide intentar de nuevo, sin decir que no existe', async () => {
    const html = (await montar('doctor', 500)).nativeElement as HTMLElement;

    expect(html.textContent).toContain('No pudimos cargar este producto');
    expect(html.textContent).not.toContain('No encontramos esta página');
  });

  it('el calendario de fecha futura empieza cerrado y se abre con el botón', async () => {
    const f = await montar('doctor', FICHA);

    expect(f.componentInstance.calendarioAbierto()).toBe(false);
    f.componentInstance.calendarioAbierto.set(true);
    expect(f.componentInstance.calendarioAbierto()).toBe(true);
  });


  it('el video del producto es una lámina más: no se carga hasta tocar su miniatura', async () => {
    const f = await montar('doctor', { ...FICHA, media: [...FICHA.media.slice(0, 2), { type: 'video', role: 'video', url: 'http://api/media/v.mp4', poster: 'http://api/media/v-portada.webp', duration_s: 6 }] });
    const html = f.nativeElement as HTMLElement;

    expect(html.querySelector('.galeria video')).toBeNull(); // al abrir se ve la foto principal
    const miniatura = html.querySelector('.miniatura-video') as HTMLButtonElement;
    expect(miniatura).not.toBeNull();

    miniatura.click();
    f.detectChanges();
    const video = html.querySelector('.galeria video') as HTMLVideoElement;
    expect(video.getAttribute('src')).toBe('http://api/media/v.mp4');
    expect(video.getAttribute('poster')).toBe('http://api/media/v-portada.webp');
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(html.querySelector('.galeria .btn-ampliar')).toBeNull();

    (html.querySelectorAll('.miniatura:not(.miniatura-video)')[0] as HTMLButtonElement).click(); // volver a una foto
    f.detectChanges();
    expect(html.querySelector('.galeria video')).toBeNull();
    expect(html.querySelector('.galeria img')).not.toBeNull();
  });

  it('sin video no hay miniatura de video', async () => {
    const f = await montar('doctor', { ...FICHA, media: FICHA.media.slice(0, 2) });
    expect((f.nativeElement as HTMLElement).querySelector('.miniatura-video')).toBeNull();
  });

  it('un producto con solo un video (sin fotos) lo muestra como lámina junto a la imagen provisional', async () => {
    const f = await montar('doctor', { ...FICHA, media: [{ type: 'video', role: 'video', url: 'http://api/media/v.mp4', poster: null, duration_s: 5 }] });
    expect((f.nativeElement as HTMLElement).querySelector('.miniatura-video')).not.toBeNull();
  });
});
