import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Carrito } from './carrito';
import { CarritoService, ItemCarrito } from '../../../aplicacion/servicios/CarritoService';

describe('Carrito', () => {
  let component: Carrito;
  let fixture: ComponentFixture<Carrito>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Carrito],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Carrito);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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
