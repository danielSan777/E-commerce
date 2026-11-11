import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { AdminConfigurador } from './configurador';

const BASE = '/api/v1/admin';
const GEO = { x: 40, y: 25, width: 20, height: 10, rot_x: 0, rot_y: 0, rot_z: 0, mirror: false };

const ACCESORIOS = [
  { id: 20, name: 'Gafas', type: 'imagen', behavior: 'gafas', text: null, category_id: 1, category: 'Moda', image: 'https://api/g.webp', thumb: null, alt: 'Gafas', sort_order: 1, is_active: true },
  { id: 21, name: 'Regalo', type: 'imagen', behavior: null, text: null, category_id: 2, category: 'Objetos', image: 'https://api/r.webp', thumb: null, alt: 'Regalo', sort_order: 2, is_active: true },
  { id: 22, name: 'Nombre', type: 'texto', behavior: null, text: 'Ingrese su nombre.', category_id: 3, category: 'Personalización', image: null, thumb: null, alt: null, sort_order: 3, is_active: true },
];

const ubicacion = (id: number, name: string, extra = {}) => ({
  location_id: id, name, allowed_categories: [], excluded_categories: [], state: 'libre', priority: id, layer: 1, fixed_accessory_id: null, preset: null, ...extra,
});

const configuracion = (extra = {}) => ({
  locations: [ubicacion(7, 'Cabeza', { allowed_categories: ['Moda'], preset: GEO }), ubicacion(8, 'Pie', { excluded_categories: ['Moda', 'Personalización'] })],
  accessory_ids: [20, 21],
  exceptions: [],
  ...extra,
});

const categoria = (extra = {}) => ({
  scope: 'category', slug: 'profesiones', name: 'Profesiones', has_config: true,
  products: [{ sku: 'PRO-DOCTOR', name: 'Doctor', uses_own_configurator: false }, { sku: 'PRO-ENFERMERA', name: 'Enfermera', uses_own_configurator: false }],
  config: configuracion(), ...extra,
});

const producto = (extra = {}) => ({
  scope: 'product', sku: 'PRO-DOCTOR', name: 'Doctor', category_slug: 'profesiones', category_name: 'Profesiones',
  uses_own_configurator: false, source: 'category', has_config: true, config: configuracion(), ...extra,
});

const esperar = () => new Promise<void>(r => setTimeout(r));

describe('AdminConfigurador', () => {
  let ctrl: HttpTestingController;
  let avisos: AvisosService;

  async function montar() {
    TestBed.configureTestingModule({ imports: [AdminConfigurador], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    ctrl = TestBed.inject(HttpTestingController);
    avisos = TestBed.inject(AvisosService);
    const fixture = TestBed.createComponent(AdminConfigurador);
    fixture.detectChanges();
    ctrl.expectOne(`${BASE}/categories`).flush({ data: [{ slug: 'profesiones', name: 'Profesiones', sort_order: 1, is_active: true }] });
    await esperar();
    fixture.detectChanges();
    return fixture;
  }

  /** Elige la categoría y contesta la configuración y los accesorios. */
  async function abrirCategoria(fixture: Awaited<ReturnType<typeof montar>>, cat = categoria()) {
    fixture.componentInstance.elegirCategoria('profesiones');
    ctrl.expectOne(`${BASE}/configurator/categories/profesiones`).flush(cat);
    await esperar();
    ctrl.expectOne(`${BASE}/accessories`).flush({ data: ACCESORIOS });
    await esperar();
    fixture.detectChanges();
  }

  /** Tras guardar, el editor recarga los accesorios: se contesta esa petición. */
  async function terminarGuardado() {
    await esperar();
    ctrl.expectOne(`${BASE}/accessories`).flush({ data: ACCESORIOS });
    await esperar();
  }

  afterEach(() => ctrl.verify());

  it('sin categoria elegida pide elegir una y no muestra el editor', async () => {
    const fixture = await montar();
    expect(fixture.nativeElement.textContent).toContain('Elige una categoría');
    expect(fixture.nativeElement.querySelector('.visor')).toBeNull();
  });

  it('al elegir una categoría carga su configuración y sus accesorios desde la API y muestra el editor', async () => {
    const fixture = await montar();
    await abrirCategoria(fixture);
    const c = fixture.componentInstance;

    expect(fixture.nativeElement.querySelector('.visor')).not.toBeNull();
    expect(c.ubicaciones().map(u => u.nombre)).toEqual(['Cabeza', 'Pie']);
    expect(c.ubicacionActual()).toBe(7);
    expect(c.idsMarcados()).toEqual([20, 21]);
    expect(c.presetActual()).toMatchObject({ x: 40, y: 25, ancho: 20, alto: 10 });
    expect(c.valoresGuardados()).toBe(true);
    // La cabeza solo admite Moda (regla que viene de la base de datos)
    expect(c.categorias()).toEqual(['Moda']);
    expect(fixture.nativeElement.textContent).toContain('Esta configuración la usan todos los productos de «Profesiones» (2)');
  });

  it('guarda la configuración de la categoría con el contrato de Laravel', async () => {
    const fixture = await montar();
    await abrirCategoria(fixture);
    const c = fixture.componentInstance;

    c.cambiarConfig('prioridad', 5);
    void c.guardarConfiguracion();
    const put = ctrl.expectOne(`${BASE}/configurator/categories/profesiones`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({
      locations: [
        { location_id: 7, state: 'libre', priority: 5, layer: 1, fixed_accessory_id: null, preset: GEO },
        { location_id: 8, state: 'libre', priority: 8, layer: 1, fixed_accessory_id: null, preset: null },
      ],
      accessory_ids: [20, 21],
      exceptions: [],
    });
    put.flush(categoria());
    await esperar();
    ctrl.expectOne(`${BASE}/accessories`).flush({ data: ACCESORIOS });
    await esperar();

    expect(avisos.lista().at(-1)?.texto).toBe('La configuración se guardó correctamente.');
    expect(c.guardando()).toBe(false);
  });

  it('no guarda si una ubicación fija no tiene elemento fijo y lo avisa', async () => {
    const fixture = await montar();
    await abrirCategoria(fixture);
    const c = fixture.componentInstance;

    c.cambiarConfig('estado', 'fija');
    await c.guardarConfiguracion();

    ctrl.expectNone(`${BASE}/configurator/categories/profesiones`);
    expect(avisos.lista().at(-1)?.texto).toBe('La ubicación "Cabeza" es fija: elige su elemento fijo y define sus valores.');
  });

  it('muestra el mensaje de Laravel si rechaza lo guardado', async () => {
    const fixture = await montar();
    await abrirCategoria(fixture);

    void fixture.componentInstance.guardarConfiguracion();
    ctrl.expectOne(`${BASE}/configurator/categories/profesiones`).flush(
      { code: 'validation_error', message: 'Revisa los datos ingresados.', errors: { 'locations.0.priority': ['La prioridad debe estar entre 1 y 99.'] } },
      { status: 422, statusText: 'Unprocessable' },
    );
    await esperar();
    fixture.detectChanges();

    const alerta = fixture.nativeElement.querySelector('[role=alert]').textContent;
    expect(alerta).toContain('Revisa los datos ingresados.');
    expect(alerta).toContain('La prioridad debe estar entre 1 y 99.');
  });

  describe('excepciones y marcados', () => {
    it('crea una excepción con los valores de la ubicación y se guarda con ellos', async () => {
      const fixture = await montar();
      await abrirCategoria(fixture);
      const c = fixture.componentInstance;

      c.crearExcepcion(c.accesorios().find(a => a.id === 20)!);

      expect(c.estaColocado(20)).toBe(true);
      expect(c.resumenUbicacion(7)).toBe('libre · con valores · 1 excepción(es)');
      expect(c.ubicacionesDe(20)).toBe('Cabeza');

      void c.guardarConfiguracion();
      const put = ctrl.expectOne(`${BASE}/configurator/categories/profesiones`);
      expect(put.request.body.exceptions).toEqual([{ accessory_id: 20, location_id: 7, ...GEO }]);
      put.flush(categoria());
      await terminarGuardado();
    });

    it('no crea una excepción en una ubicación deshabilitada, sin valores o repetida y explica por qué', async () => {
      const fixture = await montar();
      await abrirCategoria(fixture);
      const c = fixture.componentInstance;
      const gafas = c.accesorios().find(a => a.id === 20)!;

      c.cambiarConfig('estado', 'deshabilitada');
      c.crearExcepcion(gafas);
      expect(avisos.lista().at(-1)?.texto).toBe('No se puede: La ubicación está deshabilitada.');

      c.cambiarConfig('estado', 'libre');
      c.crearExcepcion(gafas);
      c.crearExcepcion(gafas);
      expect(avisos.lista().at(-1)?.texto).toBe('No se puede: Este accesorio ya tiene una excepción en esta ubicación.');
      expect(c.accesoriosColocados().filter(a => a.accesorioId === 20).length).toBe(1);

      c.cambiarUbicacion(8);
      c.crearExcepcion(c.accesorios().find(a => a.id === 21)!);
      expect(avisos.lista().at(-1)?.texto).toBe('No se puede: Primero define los valores de la ubicación.');
    });

    it('al desmarcar un accesorio se quitan sus excepciones y deja de ser elemento fijo', async () => {
      const fixture = await montar();
      await abrirCategoria(fixture);
      const c = fixture.componentInstance;
      const gafas = c.accesorios().find(a => a.id === 20)!;

      c.crearExcepcion(gafas);
      c.cambiarConfig('estado', 'fija');
      c.cambiarConfig('fijoId', 20);

      c.alternarMarcado(gafas, false);

      expect(c.estaMarcado(20)).toBe(false);
      expect(c.estaColocado(20)).toBe(false);
      expect(c.configUbicaciones()[7].fijoId).toBeNull();
    });

    it('definir y guardar los valores de una ubicación nueva habilita elegir accesorios', async () => {
      const fixture = await montar();
      await abrirCategoria(fixture);
      const c = fixture.componentInstance;

      c.cambiarUbicacion(8);
      expect(c.valoresGuardados()).toBe(false);
      c.definirPreset();
      expect(c.presetActual()).toMatchObject({ x: 42.5, y: 42.5, ancho: 15, alto: 15 });
      c.guardarValoresUbicacion();

      expect(c.valoresGuardados()).toBe(true);
      expect(c.categorias()).toEqual(['Objetos']);
      expect(c.marcadosDeUbicacion().map(a => a.id)).toEqual([21]);
    });

    it('escribir un valor fuera de rango lo corrige al confirmar', async () => {
      const fixture = await montar();
      await abrirCategoria(fixture);
      const c = fixture.componentInstance;

      c.seleccionarAccesorio(c.presetActual()!);
      const entrada = { target: { value: '200' } } as unknown as Event;
      c.editarValor(entrada, 'ancho');
      expect(c.porcentajeAncho()).toBe(20);
      c.confirmarValor(entrada, 'ancho');
      expect(c.porcentajeAncho()).toBe(80);
      expect(c.presetActual()?.ancho).toBe(80);
    });
  });

  describe('productos de la categoría', () => {
    it('un producto que usa la configuración de la categoría no muestra el editor y ofrece cambiar a propia', async () => {
      const fixture = await montar();
      await abrirCategoria(fixture);
      const c = fixture.componentInstance;

      c.elegirProducto('PRO-DOCTOR');
      ctrl.expectOne(`${BASE}/configurator/products/PRO-DOCTOR`).flush(producto());
      await esperar();
      fixture.detectChanges();

      expect(c.editable()).toBe(false);
      expect(fixture.nativeElement.querySelector('.visor')).toBeNull();
      expect(fixture.nativeElement.textContent).toContain('Usa la misma configuración de la categoría «Profesiones»');
      expect(fixture.nativeElement.textContent).toContain('Tiene una configuración diferente');
    });

    it('al marcar configuración propia pide partir de una copia de la categoría y abre el editor del producto', async () => {
      const fixture = await montar();
      await abrirCategoria(fixture);
      const c = fixture.componentInstance;
      c.elegirProducto('PRO-DOCTOR');
      ctrl.expectOne(`${BASE}/configurator/products/PRO-DOCTOR`).flush(producto({ has_config: false }));
      await esperar();

      c.cambiarModo(true, true);
      const modo = ctrl.expectOne(`${BASE}/configurator/products/PRO-DOCTOR/mode`);
      expect(modo.request.body).toEqual({ uses_own_configurator: true, copy_from_category: true });
      modo.flush(producto({ uses_own_configurator: true, source: 'product', config: configuracion({ accessory_ids: [21] }) }));
      await esperar();
      ctrl.expectOne(`${BASE}/accessories`).flush({ data: ACCESORIOS });
      await esperar();
      fixture.detectChanges();

      expect(c.editable()).toBe(true);
      expect(c.idsMarcados()).toEqual([21]);
      expect(c.conPropia()).toBe(1);
      expect(fixture.nativeElement.querySelector('.visor')).not.toBeNull();
    });

    it('guardar un producto con configuración propia usa el endpoint del producto, no el de la categoría', async () => {
      const fixture = await montar();
      await abrirCategoria(fixture);
      const c = fixture.componentInstance;
      c.elegirProducto('PRO-DOCTOR');
      ctrl.expectOne(`${BASE}/configurator/products/PRO-DOCTOR`).flush(producto({ uses_own_configurator: true, source: 'product' }));
      await esperar();
      ctrl.expectOne(`${BASE}/accessories`).flush({ data: ACCESORIOS });
      await esperar();

      void c.guardarConfiguracion();
      const put = ctrl.expectOne(`${BASE}/configurator/products/PRO-DOCTOR`);
      expect(put.request.method).toBe('PUT');
      put.flush(producto({ uses_own_configurator: true, source: 'product' }));
      await terminarGuardado();
    });

    it('elegir "toda la categoría" vuelve a editar la configuración de la categoría', async () => {
      const fixture = await montar();
      await abrirCategoria(fixture);
      const c = fixture.componentInstance;
      c.elegirProducto('PRO-DOCTOR');
      ctrl.expectOne(`${BASE}/configurator/products/PRO-DOCTOR`).flush(producto());
      await esperar();

      c.elegirProducto('');
      ctrl.expectOne(`${BASE}/accessories`).flush({ data: ACCESORIOS });
      await esperar();

      expect(c.editable()).toBe(true);
      expect(c.productoSku()).toBe('');
    });
  });

  it('vaciar la configuración guarda todas las ubicaciones libres y sin valores, y ningún accesorio', async () => {
    const fixture = await montar();
    await abrirCategoria(fixture);
    const c = fixture.componentInstance;

    c.vaciarConfiguracion();
    const put = ctrl.expectOne(`${BASE}/configurator/categories/profesiones`);
    expect(put.request.body).toEqual({
      locations: [
        { location_id: 7, state: 'libre', priority: 1, layer: 1, fixed_accessory_id: null, preset: null },
        { location_id: 8, state: 'libre', priority: 2, layer: 1, fixed_accessory_id: null, preset: null },
      ],
      accessory_ids: [],
      exceptions: [],
    });
    put.flush(categoria({ has_config: true, config: configuracion({ accessory_ids: [], locations: [ubicacion(7, 'Cabeza'), ubicacion(8, 'Pie')] }) }));
    await terminarGuardado();
  });
});
