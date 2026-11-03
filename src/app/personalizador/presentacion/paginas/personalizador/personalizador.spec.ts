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
});
