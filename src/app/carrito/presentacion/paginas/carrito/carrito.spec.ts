import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { productoListadoApi } from '../../../../testing/catalogo-api';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModoVentaService } from '../../../../catalogo/aplicacion/servicios/ModoVentaService';
import { Carrito } from './carrito';
import { CarritoService, ItemCarrito } from '../../../aplicacion/servicios/CarritoService';

const PRODUCTOS = [
  productoListadoApi('doctor', 'Doctor', { category: { slug: 'profesiones-y-hobbies', name: 'Profesiones y Hobbies' }, price: { ...productoListadoApi('x').price, final_cents: 2250 } }),
  productoListadoApi('bob', 'Bob corazón'),
  productoListadoApi('agotado', 'Agotado', { available: false, category: { slug: 'familia', name: 'Familia' } }),
];

const COMPLEMENTOS = [
  { ...productoListadoApi('tarjeta', 'Tarjeta de regalo'), price: { ...productoListadoApi('x').price, final_cents: 300 } },
  { ...productoListadoApi('caja', 'Caja'), available: false },
];

describe('Carrito', () => {
  let component: Carrito;
  let fixture: ComponentFixture<Carrito>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Carrito],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }],
    }).compileComponents();

    fixture = TestBed.createComponent(Carrito);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/products').flush({ data: PRODUCTOS });
    http.expectOne('/api/v1/products?type=complemento').flush({ data: COMPLEMENTOS });
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('modo de venta «todo con envío gratis»', () => {
    const maceta = (uid: string, precio: number): ItemCarrito => ({ uid, tipo: 'personalizado', producto: { id: uid, nombre: uid, precio }, vista: '', ruta: '', resumen: [] });
    const activar = () => TestBed.inject(ModoVentaService).precios.set({
      mode: 'free_shipping_discount', free_shipping_min_planters: 2, card_surcharge_percent: 0, discount_percent: 30, free_shipping_everywhere: true,
    });

    it('con una maceta invita a elegir la segunda con 30 % de descuento en la de menor valor; el envío ya es gratis', () => {
      activar();
      TestBed.inject(CarritoService).items.set([maceta('a', 20)]);
      fixture.detectChanges();
      const html = fixture.nativeElement as HTMLElement;

      expect(html.querySelector('.franja-verde h2')?.textContent).toContain('Elige tu segunda maceta con 30% de descuento en la de menor valor');
      expect(html.querySelector('.pie-envio')?.textContent).toContain('¡Gratis!');
      expect(html.querySelector('.pie-descuento')).toBeNull();
    });

    it('con $20 y $19 muestra el descuento sobre la de $19 y el total final', () => {
      activar();
      TestBed.inject(CarritoService).items.set([maceta('a', 20), maceta('b', 19)]);
      fixture.detectChanges();
      const html = fixture.nativeElement as HTMLElement;

      expect(html.querySelector('.pie-descuento-valor')?.textContent).toContain('5.70');
      expect(html.querySelector('.pie-total .pie-subtotal')?.textContent).toContain('33.30');
      expect(html.querySelector('.franja-verde h2')?.textContent).toContain('Envío GRATIS y 30% de descuento');
    });

    it('en el modo estándar no hay descuento ni fila de total', () => {
      TestBed.inject(CarritoService).items.set([maceta('a', 20), maceta('b', 19)]);
      fixture.detectChanges();
      const html = fixture.nativeElement as HTMLElement;

      expect(html.querySelector('.pie-descuento')).toBeNull();
      expect(html.querySelector('.pie-total')).toBeNull();
      expect(html.querySelector('.franja-verde h2')?.textContent).toContain('Ya tienes envío GRATIS');
    });
  });

  it('"Complementa tu regalo" sale de los productos de tipo complemento de Laravel, sin categorías', () => {
    expect(component.complementos().map(c => c.nombre)).toEqual(['Tarjeta de regalo']);
    expect(component.complementos()[0]).toMatchObject({ id: 'JDS-tarjeta', precio: 3 });
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('.franja-rosa')).toBeNull(); // el carrito está vacío: la franja solo sale con productos en el carrito
  });

  it('"Otras macetas" salen de los productos de Laravel: solo los disponibles, con su precio final y sus categorías', () => {
    expect(component.macetas().map(m => m.slug)).toEqual(['doctor', 'bob']);
    expect(component.macetas()[0]).toMatchObject({ id: 'JDS-doctor', precio: 22.5, categoria: 'profesiones-y-hobbies' });
    expect(component.catsMacetas()).toEqual([
      { clave: 'profesiones-y-hobbies', etiqueta: 'Profesiones y Hobbies' },
      { clave: 'amor', etiqueta: 'Amor' },
    ]);
    expect(component.macetasDeCategoria().map(m => m.slug)).toEqual(['doctor']);
  });

  describe('complementos sin maceta e idénticas', () => {
    const complemento: ItemCarrito = { uid: 'c1', tipo: 'complemento', producto: { id: 'acc-1', nombre: 'Lentes', precio: 2 }, vista: '', ruta: '', resumen: [] };
    const maceta = (uid: string): ItemCarrito => ({
      uid, tipo: 'personalizado', producto: { id: 'doctor', nombre: 'Doctor', precio: 20 }, vista: '', ruta: '', resumen: [],
      configuracion: { accesorios: [], nombre: 'Ana', colorLentes: 'negro', colorGafas: 'negro', dedicatoria: 'Hola', textoMarco: '', sinTarjeta: false, fotoMarcoNombre: '' },
    });

    beforeEach(() => TestBed.inject(CarritoService).vaciar());
    afterEach(() => TestBed.inject(CarritoService).vaciar());

    it('la maceta del carrito se pinta al instante con sus accesorios (sin esperar ninguna imagen armada); la foto del pedido llega después', async () => {
      const servicio = TestBed.inject(CarritoService);
      const html = fixture.nativeElement as HTMLElement;
      const escena = { imagenBase: 'http://api/media/base.webp', ajuste: { escala: 100, x: 0, y: 0 }, accesorios: [], nombre: 'Ana', colorTexto: '#C7B084', tintes: {} };

      servicio.guardar({ ...maceta('m1'), escena });
      await fixture.whenStable();
      fixture.detectChanges();
      expect(html.querySelector('.item-foto app-vista-maceta')).not.toBeNull();
      expect(html.querySelector('.item-foto > img')).toBeNull();

      servicio.ponerVista('m1', 'data:image/jpeg;base64,AAA');
      expect(servicio.buscar('m1')?.vista).toBe('data:image/jpeg;base64,AAA');
      expect(servicio.buscar('m1')?.escena).toEqual(escena);

      servicio.ponerVista('no-existe', 'data:image/jpeg;base64,BBB'); // un item que ya no está: no hace nada
      expect(servicio.items().length).toBe(1);
    });

    it('la franja "Complementa tu regalo" solo sale con al menos una maceta en el carrito', async () => {
      const servicio = TestBed.inject(CarritoService);
      const html = fixture.nativeElement as HTMLElement;

      servicio.guardar(maceta('m1'));
      await fixture.whenStable();
      fixture.detectChanges();
      expect(html.querySelector('.franja-rosa')).not.toBeNull();

      servicio.quitar('m1');
      servicio.guardar(complemento);
      await fixture.whenStable();
      fixture.detectChanges();
      expect(html.querySelector('.franja-rosa')).toBeNull();

      // y sin maceta no se puede agregar un complemento aunque se intente
      servicio.vaciar();
      component.agregarComplemento(component.complementos()[0]);
      expect(servicio.items().length).toBe(0);
    });

    it('con solo complementos bloquea el checkout y muestra el mensaje', async () => {
      TestBed.inject(CarritoService).guardar(complemento);
      await fixture.whenStable();
      const html = fixture.nativeElement as HTMLElement;

      expect(component.sinMaceta()).toBe(true);
      expect(html.textContent).toContain('Los complementos acompañan a una maceta. Agrega una maceta para continuar.');
      expect(html.querySelector('a.btn-continuar')).toBeNull();
    });

    it('con una maceta el checkout queda libre', async () => {
      const servicio = TestBed.inject(CarritoService);
      servicio.guardar(complemento);
      servicio.guardar(maceta('m1'));
      await fixture.whenStable();

      expect(component.sinMaceta()).toBe(false);
      expect((fixture.nativeElement as HTMLElement).querySelector('a.btn-continuar')).not.toBeNull();
    });

    it('pregunta por dos macetas iguales y "Sí" las conserva', async () => {
      const servicio = TestBed.inject(CarritoService);
      servicio.guardar(maceta('m1'));
      servicio.guardar(maceta('m2'));
      await fixture.whenStable();

      expect((fixture.nativeElement as HTMLElement).textContent).toContain('Tienes dos macetas exactamente iguales. ¿Es correcto?');
      component.confirmarIguales();
      await fixture.whenStable();

      expect(component.macetaIgual()).toBeUndefined();
      expect(servicio.items().length).toBe(2);
    });
  });
});
