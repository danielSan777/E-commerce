import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { productoListadoApi } from '../../../../testing/catalogo-api';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Carrito } from './carrito';
import { CarritoService, ItemCarrito } from '../../../aplicacion/servicios/CarritoService';

const PRODUCTOS = [
  productoListadoApi('doctor', 'Doctor', { category: { slug: 'profesiones-y-hobbies', name: 'Profesiones y Hobbies' }, price: { ...productoListadoApi('x').price, final_cents: 2250 } }),
  productoListadoApi('bob', 'Bob corazón'),
  productoListadoApi('agotado', 'Agotado', { available: false, category: { slug: 'familia', name: 'Familia' } }),
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
    TestBed.inject(HttpTestingController).expectOne('/api/v1/products').flush({ data: PRODUCTOS });
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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
