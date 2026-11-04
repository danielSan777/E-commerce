import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Personalizador } from './personalizador';

describe('Personalizador', () => {
  let component: Personalizador;
  let fixture: ComponentFixture<Personalizador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Personalizador],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Personalizador);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('dedicatoria (solo texto, todo antes de pagar)', () => {
    it('es obligatoria mientras no elija "No quiero dedicatoria"', () => {
      expect(component.sinTarjeta()).toBe(false);
      expect(component.tarjetaObligatoria()).toBe(true);
    });

    it('con "No quiero dedicatoria" deja de ser obligatoria', () => {
      component.alternarSinTarjeta();

      expect(component.sinTarjeta()).toBe(true);
      expect(component.tarjetaObligatoria()).toBe(false);
    });

    it('si ya escribió una dedicatoria, no puede marcar "No quiero dedicatoria" hasta borrarla', () => {
      component.dedicatoria.set('Gracias por todo');
      component.alternarSinTarjeta();

      expect(component.sinTarjeta()).toBe(false);
      expect(component.avisoExtra()).toBe('sin');

      component.dedicatoria.set('');
      component.alternarSinTarjeta();

      expect(component.sinTarjeta()).toBe(true);
    });

    it('no ofrece enviar la tarjeta, la foto o la frase por WhatsApp después ni subir foto de tarjeta', () => {
      const interno = component as unknown as Record<string, unknown>;

      for (const nombre of ['tarjetaWhatsapp', 'marcoWhatsapp', 'alternarTarjetaWhatsapp', 'alternarMarcoWhatsapp', 'elegirFotoTarjeta', 'fotoTarjetaUrl']) {
        expect(interno[nombre]).toBeUndefined();
      }
    });
  });

  describe('límites con emojis y borrador', () => {
    const evento = (valor: string) => ({ target: { value: valor } }) as unknown as Event;

    it('la frase del marco cuenta cada emoji como 1 y corta en 60', () => {
      component.escribirTextoMarco(evento('🌿'.repeat(70)));

      expect(component.contar(component.textoMarco())).toBe(60);
    });

    it('la dedicatoria acepta 250 emojis', () => {
      component.escribirDedicatoria(evento('❤'.repeat(260)));

      expect(component.contar(component.dedicatoria())).toBe(250);
    });

    it('el nombre de la placa no admite emojis', () => {
      component.cambiarNombre('Ana 🌿 Peña');

      expect(component.nombreCliente()).toBe('Ana  Peña');
    });

    it('"Continuar personalización" vuelve a poner el borrador', () => {
      component.borrador.set({
        accesorios: [], nombre: 'Ana', colorLentes: 'negro', colorGafas: 'negro',
        dedicatoria: 'Gracias', textoMarco: '', sinTarjeta: false, fotoMarcoNombre: '',
      });

      component.continuarBorrador();

      expect(component.nombreCliente()).toBe('Ana');
      expect(component.dedicatoria()).toBe('Gracias');
      expect(component.borrador()).toBeNull();
    });
  });
});
