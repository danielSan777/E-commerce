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

  describe('categorías que llegan de la base sin tilde ni mayúscula', () => {
    const geo = { x: 10, y: 80, ancho: 40, alto: 10, rotX: 0, rotY: 0, rotZ: 0, espejo: false };
    const cargar = () => (component as unknown as { aplicarConfiguracion(c: unknown): void }).aplicarConfiguracion({
      configurado: true,
      ubicaciones: [
        { id: 1, nombre: 'base', categorias: ['personalizacion'], estado: 'libre', prioridad: 1, capa: 1, fijoId: null, preset: geo },
        { id: 2, nombre: 'izquierda', categorias: ['objetos'], estado: 'libre', prioridad: 2, capa: 1, fijoId: null, preset: geo },
      ],
      excepciones: [],
      catalogo: [
        { id: 1, nombre: 'nombre', imagen: '', tipo: 'texto', texto: 'Ingrese su nombre.', categoria: 'personalizacion' },
        { id: 2, nombre: 'marco-foto', imagen: '/m.webp', tipo: 'imagen', categoria: 'objetos' },
      ],
    });

    it('el nombre sale puesto en la base y la pestaña Nombre muestra el campo de texto', () => {
      cargar();
      expect(component.hayTexto()).toBe(true);
      expect(component.accesoriosSeleccionados().find(a => a.tipo === 'texto')?.ubicacionId).toBe(1);
      component.cambiarNombre('Dr. Luis');
      expect(component.nombreCliente()).toBe('Dr. Luis');
    });

    it('el accesorio nombre y su categoría no aparecen en la pestaña Accesorios', () => {
      cargar();
      expect(component.categoriasAccesorios()).toEqual(['Todos', 'Objetos']);
      component.categoriaActual.set('Todos');
      expect(component.accesoriosDeCategoria().map(a => a.nombre)).toEqual(['marco-foto']);
      expect(component.accesoriosPersonalizacion().map(a => a.nombre)).toEqual(['nombre']);
    });

    it('el nombre no cuenta entre los complementos', () => {
      cargar();
      expect(component.cantidadContada()).toBe(1);
    });
  });

  describe('elegir dos accesorios', () => {
    const geo = { x: 10, y: 80, ancho: 20, alto: 10, rotX: 0, rotY: 0, rotZ: 0, espejo: false };
    const ub = (id: number, nombre: string, extra = {}) => ({ id, nombre, categorias: undefined, estado: 'libre', prioridad: id, capa: 1, fijoId: null, preset: geo, ...extra });
    const catalogo = [
      { id: 10, nombre: 'corazon', imagen: '/c.webp', tipo: 'imagen', categoria: 'objetos' },
      { id: 11, nombre: 'marco-foto', imagen: '/m.webp', tipo: 'imagen', categoria: 'objetos' },
      { id: 12, nombre: 'caja', imagen: '/x.webp', tipo: 'imagen', categoria: 'objetos' },
    ];
    const cargar = (ubicaciones: unknown[]) => (component as unknown as { aplicarConfiguracion(c: unknown): void })
      .aplicarConfiguracion({ configurado: true, ubicaciones, excepciones: [], catalogo });
    const nombres = () => component.accesoriosSeleccionados().map(a => a.nombre).sort();

    it('con dos ubicaciones libres caben dos accesorios a la vez', async () => {
      cargar([ub(1, 'izquierda', { categorias: ['objetos'] }), ub(2, 'derecha', { categorias: ['objetos'] })]);
      for (const a of component.accesoriosSeleccionados()) component.quitarAccesorio(a.accesorioId);
      await component.pulsarTarjeta(component.catalogo()[1]);
      await component.pulsarTarjeta(component.catalogo()[2]);
      expect(nombres()).toEqual(['caja', 'marco-foto']);
    });

    it('con una sola ubicación libre para objetos (la otra es fija) el segundo reemplaza al primero', async () => {
      cargar([ub(1, 'izquierda', { estado: 'fija', fijoId: 10 }), ub(2, 'derecha', { categorias: ['objetos'] })]);
      for (const a of component.accesoriosSeleccionados().filter(x => x.accesorioId !== 10)) component.quitarAccesorio(a.accesorioId);
      await component.pulsarTarjeta(component.catalogo()[1]);
      await component.pulsarTarjeta(component.catalogo()[2]);
      // Solo hay un lugar libre para objetos: el segundo reemplaza al primero (el corazón fijo no cuenta ni se mueve)
      expect(nombres()).toEqual(['caja', 'corazon']);
    });
  });
});
