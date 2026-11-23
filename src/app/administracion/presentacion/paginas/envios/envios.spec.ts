import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { AdminEnvios, porcentajeValido, validarZona } from './envios';

const ZONAS = [
  { code: 'A', name: 'Zona A', price_cents: 350, extra_days: 0, is_available: true, cantons_count: 1 },
  { code: 'B', name: 'Zona B', price_cents: 625, extra_days: 1, is_available: true, cantons_count: 1 },
  { code: 'C', name: 'Zona C', price_cents: 500, extra_days: 0, is_available: true, cantons_count: 0 },
  { code: 'no_disponible', name: 'No disponible', price_cents: 0, extra_days: 0, is_available: false, cantons_count: 0 },
];
const CANTONES = [
  { code: '0901', name: 'Guayaquil', is_locality: false, province_code: '09', province_name: 'Guayas', zone: 'A' },
  { code: '0101', name: 'Cuenca', is_locality: false, province_code: '01', province_name: 'Azuay', zone: 'B' },
];

const AJUSTE_ESTANDAR = { mode: 'standard', discount_percent: 30, card_surcharge_percent: 6, free_shipping_min_planters: 2 };

describe('AdminEnvios', () => {
  let http: HttpTestingController;

  async function abrir() {
    TestBed.configureTestingModule({ imports: [AdminEnvios], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminEnvios);
    fixture.detectChanges();
    http.expectOne('/api/v1/admin/sales-mode').flush(AJUSTE_ESTANDAR);
    http.expectOne('/api/v1/admin/shipping/zones').flush({ data: ZONAS });
    http.expectOne('/api/v1/admin/shipping/cantons').flush({ data: CANTONES });
    await fixture.whenStable();
    return fixture;
  }

  afterEach(() => http?.verify());

  it('el porcentaje de descuento acepta de 0 a 100, con coma o punto y hasta 2 decimales', () => {
    expect(porcentajeValido('30')).toBe(30);
    expect(porcentajeValido(' 12,5 ')).toBe(12.5);
    expect(porcentajeValido('0')).toBe(0);
    expect(porcentajeValido('100')).toBe(100);
    for (const malo of ['', 'abc', '-1', '101', '10.123', '30%', '1e2']) expect(porcentajeValido(malo)).toBeNull();
  });

  it('muestra el modo de venta activo y lo cambia al guardar con su porcentaje (el otro modo queda guardado en Laravel)', async () => {
    const fixture = await abrir();
    const c = fixture.componentInstance;
    const html = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();

    expect(html.textContent).toContain('Activo ahora');
    expect(c.descuentoTexto()).toBe('30');
    expect(c.modoSinGuardar()).toBe(false);
    c.guardarModo();
    http.expectNone('/api/v1/admin/sales-mode');                      // nada cambió: no llama a la API

    c.modoElegido.set('free_shipping_discount');
    c.descuentoTexto.set('45,5');
    expect(c.modoSinGuardar()).toBe(true);
    c.guardarModo();
    const r = http.expectOne('/api/v1/admin/sales-mode');
    expect(r.request.method).toBe('PUT');
    expect(r.request.body).toEqual({ mode: 'free_shipping_discount', discount_percent: 45.5 });
    r.flush({ ...AJUSTE_ESTANDAR, mode: 'free_shipping_discount', discount_percent: 45.5 });
    fixture.detectChanges();

    expect(c.ajusteModo()?.mode).toBe('free_shipping_discount');
    expect(c.descuentoTexto()).toBe('45.5');
    expect(c.modoSinGuardar()).toBe(false);
  });

  it('cambiar solo el porcentaje también se guarda; un porcentaje inválido no llama a la API', async () => {
    const fixture = await abrir();
    const c = fixture.componentInstance;

    c.descuentoTexto.set('150');
    c.guardarModo();
    http.expectNone('/api/v1/admin/sales-mode');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Escribe un porcentaje de 0 a 100');

    c.descuentoTexto.set('25');
    c.guardarModo();
    expect(http.expectOne('/api/v1/admin/sales-mode').request.body).toEqual({ mode: 'standard', discount_percent: 25 });
  });

  it('valida precio y días antes de llamar a la API', () => {
    expect(validarZona({ precio: '3.50', dias: 0, disponible: true })).toEqual({});
    expect(validarZona({ precio: 'abc', dias: 0, disponible: true })['precio']).toBeDefined();
    expect(validarZona({ precio: '3.505', dias: 0, disponible: true })['precio']).toBeDefined();
    expect(validarZona({ precio: '3', dias: 31, disponible: true })['dias']).toBeDefined();
    expect(validarZona({ precio: '3', dias: '', disponible: true })['dias']).toBeDefined();
  });

  it('muestra las zonas con su precio en dólares y todos los cantones', async () => {
    const fixture = await abrir();
    const el: HTMLElement = fixture.nativeElement;
    expect((el.querySelector('#precio-A') as HTMLInputElement).value).toBe('3.50');
    expect((el.querySelector('#precio-B') as HTMLInputElement).value).toBe('6.25');
    expect(el.querySelectorAll('.tabla li').length).toBe(3); // cabecera + 2 cantones
  });

  it('filtra por texto y por zona sin llamar a la API', async () => {
    const fixture = await abrir();
    const c = fixture.componentInstance;
    c.texto.set('cuen');
    expect(c.visibles().map(x => x.name)).toEqual(['Cuenca']);
    c.texto.set('');
    c.zonaFiltro.set('A');
    expect(c.visibles().map(x => x.name)).toEqual(['Guayaquil']);
    c.limpiarFiltros();
    c.provincia.set('09');
    expect(c.visibles().length).toBe(1);
  });

  it('guarda la tarifa de una zona en centavos', async () => {
    const fixture = await abrir();
    const c = fixture.componentInstance;
    c.ponerFormulario('C', 'precio', '5,50');
    c.guardarZona('C', new Event('submit'));
    const put = http.expectOne('/api/v1/admin/shipping/zones/C');
    expect(put.request.body).toEqual({ price_cents: 550, extra_days: 0, is_available: true });
    put.flush({ code: 'C', name: 'Zona C', price_cents: 550, extra_days: 0, is_available: true });
    expect(c.zonas().find(z => z.code === 'C')?.price_cents).toBe(550);
  });

  it('no envía una tarifa inválida', async () => {
    const fixture = await abrir();
    const c = fixture.componentInstance;
    c.ponerFormulario('C', 'precio', 'x');
    c.guardarZona('C', new Event('submit'));
    http.expectNone('/api/v1/admin/shipping/zones/C');
    expect(TestBed.inject(AvisosService).lista().length).toBe(1);
  });

  it('mueve un cantón y varios marcados a otra zona', async () => {
    const fixture = await abrir();
    const c = fixture.componentInstance;

    c.cambiarZona(CANTONES[1] as never, 'C');
    http.expectOne('/api/v1/admin/shipping/cantons/zone').flush({ updated: 1 });
    http.expectOne('/api/v1/admin/shipping/zones').flush({ data: ZONAS });
    expect(c.cantones().find(x => x.code === '0101')?.zone).toBe('C');

    c.marcarVisibles(true);
    c.zonaMasiva = 'B';
    c.moverMarcados();
    const masiva = http.expectOne('/api/v1/admin/shipping/cantons/zone');
    expect(masiva.request.body).toEqual({ zone: 'B', cantons: ['0901', '0101'] });
    masiva.flush({ updated: 2 });
    http.expectOne('/api/v1/admin/shipping/zones').flush({ data: ZONAS });
    expect(c.cantones().every(x => x.zone === 'B')).toBe(true);
    expect(c.marcados().size).toBe(0);
  });
});
