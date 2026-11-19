import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { AdminCampanas, aFechaAnual, leerFechaAnual, normalizarHex, textoFechaAnual, validarCampana } from './campanas';

const esperar = () => new Promise<void>(r => setTimeout(r));

const campana = (extra = {}) => ({
  slug: 'san-valentin', name: 'San Valentín',
  start_md: '01-15', end_md: '02-14', event_md: '02-14', tagline: null, slogan: null, theme_color: null, emoji: null, cover_url: null, video_url: null, closing_message: null, closing_until_md: null, is_active: true,
  seo_title: null, seo_description: null, products: [{ sku: 'A-2', slug: 'b', name: 'Dos' }], state: 'upcoming', season_year: 2027, updated_at: 'x', ...extra,
});
const prod = (sku: string, name: string) => ({ sku, slug: sku.toLowerCase(), name, is_active: true });

describe('fechas anuales', () => {
  it('convierte entre "MM-DD" y día/mes', () => {
    expect(leerFechaAnual('05-10')).toEqual({ dia: 10, mes: 5 });
    expect(aFechaAnual({ dia: 4, mes: 2 })).toBe('02-04');
    expect(textoFechaAnual('02-14')).toBe('14 de febrero');
  });
});

describe('validarCampana (sin llamar a la API)', () => {
  const ok = { name: 'Navidad', inicio: { dia: 1, mes: 11 }, fin: { dia: 24, mes: 12 }, evento: { dia: 25, mes: 12 } };

  it('un formulario correcto no tiene errores', () => expect(validarCampana(ok)).toEqual({}));

  it('la temporada no puede terminar antes de empezar (9 de noviembre → 8 de noviembre)', () => {
    expect(validarCampana({ ...ok, inicio: { dia: 9, mes: 11 }, fin: { dia: 8, mes: 11 } }).fin).toBe('La temporada no puede terminar antes de empezar.');
  });

  it('puede empezar y terminar el mismo día', () => {
    expect(validarCampana({ ...ok, inicio: { dia: 9, mes: 11 }, fin: { dia: 9, mes: 11 } }).fin).toBeUndefined();
  });

  it('el evento no puede ser antes de que empiece la temporada, pero sí después de que termine', () => {
    expect(validarCampana({ ...ok, evento: { dia: 31, mes: 10 } }).evento).toBe('El evento no puede ser antes de que empiece la temporada.');
    expect(validarCampana(ok).evento).toBeUndefined();
  });

  it('rechaza días que no existen (31 de febrero) pero acepta el 29 de febrero', () => {
    expect(validarCampana({ ...ok, fin: { dia: 31, mes: 2 } }).fin).toContain('no existe');
    expect(validarCampana({ ...ok, inicio: { dia: 29, mes: 2 }, fin: { dia: 1, mes: 3 }, evento: { dia: 1, mes: 3 } })).toEqual({});
  });

  it('el mensaje de cierre pide una fecha después del fin y antes del siguiente inicio', () => {
    const base = { ...ok, inicio: { dia: 15, mes: 1 }, fin: { dia: 14, mes: 2 }, evento: { dia: 14, mes: 2 }, closing_message: 'San Valentín regresará pronto' };
    expect(validarCampana({ ...base, cierra: { dia: 14, mes: 3 } }).cierre).toBeUndefined();
    expect(validarCampana({ ...base, cierra: { dia: 14, mes: 2 } }).cierre).toContain('después de que termina');
    expect(validarCampana({ ...base, cierra: { dia: 1, mes: 2 } }).cierre).toContain('después de que termina');
    expect(validarCampana({ ...base, cierra: { dia: 31, mes: 4 } }).cierre).toContain('no existe');
  });

  it('una temporada de un solo día acepta cualquier fecha posterior (10 de noviembre → hasta el 12)', () => {
    const dia = { dia: 10, mes: 11 };
    expect(validarCampana({ ...ok, inicio: dia, fin: dia, evento: dia, closing_message: 'x', cierra: { dia: 12, mes: 11 } }).cierre).toBeUndefined();
    expect(validarCampana({ ...ok, inicio: dia, fin: dia, evento: dia, closing_message: 'x', cierra: dia }).cierre).toContain('después de que termina');
  });

  it('sin mensaje de cierre no se revisa la fecha', () => {
    expect(validarCampana({ ...ok, closing_message: ' ', cierra: { dia: 1, mes: 11 } }).cierre).toBeUndefined();
  });

  it('el cierre puede cruzar el año (Navidad hasta el 10 de enero)', () => {
    expect(validarCampana({ ...ok, closing_message: 'x', cierra: { dia: 10, mes: 1 } }).cierre).toBeUndefined();
  });

  it('pide nombre y categoría', () => {
    const e = validarCampana({ ...ok, name: '  ' });
    expect(e.name).toBe('Escribe el nombre de la campaña.');
  });
});

describe('AdminCampanas', () => {
  let ctrl: HttpTestingController;

  async function montar() {
    TestBed.configureTestingModule({ imports: [AdminCampanas], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }] });
    ctrl = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminCampanas);
    fixture.detectChanges();
    ctrl.expectOne('/api/v1/admin/campaigns').flush({ data: [campana()] });
    ctrl.expectOne('/api/v1/admin/categories').flush({ data: [{ slug: 'familia', name: 'Familia' }] });
    await esperar();
    fixture.detectChanges();
    return fixture;
  }

  it('lista las campañas con su estado de temporada calculado por Laravel', async () => {
    const texto = (await montar()).nativeElement.textContent;
    expect(texto).toContain('San Valentín');
    expect(texto).toContain('15 de enero al 14 de febrero');
    expect(texto).toContain('llega en 2027');
  });

  const pagina = (skus: [string, string][], total: number, page = 1) => ({
    data: skus.map(([sku, name]) => prod(sku, name)), meta: { total, page, per_page: 20, last_page: Math.ceil(total / 20) },
  });
  const pedidosDeProductos = () => ctrl.match(r => r.url === '/api/v1/admin/products');

  it('al abrir el formulario pide solo la primera parte de los productos', async () => {
    const c = (await montar()).componentInstance;
    c.nueva();
    const [req] = pedidosDeProductos();
    expect(req.request.params.get('per_page')).toBe('20');
    expect(req.request.params.get('page')).toBe('1');
    req.flush(pagina([['A-1', 'Uno'], ['A-2', 'Dos']], 45));
    expect(c.resultados().length).toBe(2);
    expect(c.hayMas()).toBe(true);
  });

  it('busca por nombre o código y por categoría en Laravel, sin traer todo', async () => {
    const c = (await montar()).componentInstance;
    c.nueva();
    pedidosDeProductos()[0].flush(pagina([['A-1', 'Uno']], 1));

    c.busqueda.set('jds-004');
    c.buscarProductos();
    const [porCodigo] = pedidosDeProductos();
    expect(porCodigo.request.params.get('q')).toBe('jds-004');
    porCodigo.flush(pagina([['JDS-004', 'abogada']], 1));
    expect(c.resultados().map(p => p.sku)).toEqual(['JDS-004']);

    c.alCambiarCategoria('familia');
    const [porCategoria] = pedidosDeProductos();
    expect(porCategoria.request.params.get('category')).toBe('familia');
    expect(porCategoria.request.params.get('q')).toBe('jds-004');
    porCategoria.flush(pagina([], 0));
    expect(c.resultados()).toEqual([]);
  });

  it('al volver a una categoría ya vista se muestra al instante, sin pedirla otra vez', async () => {
    const c = (await montar()).componentInstance;
    c.nueva();
    pedidosDeProductos()[0].flush(pagina([['A-1', 'Uno']], 1));
    c.alCambiarCategoria('familia');
    pedidosDeProductos()[0].flush(pagina([['F-1', 'Familiar']], 1));
    c.alCambiarCategoria('');
    expect(pedidosDeProductos().length).toBe(0);
    expect(c.resultados().map(p => p.sku)).toEqual(['A-1']);
    c.alCambiarCategoria('familia');
    expect(pedidosDeProductos().length).toBe(0);
    expect(c.resultados().map(p => p.sku)).toEqual(['F-1']);
  });

  it('"Cargar más" pide la siguiente página y la suma a la lista; los elegidos conservan su nombre', async () => {
    const c = (await montar()).componentInstance;
    c.nueva();
    pedidosDeProductos()[0].flush(pagina([['A-1', 'Uno']], 2));
    c.alternar('A-1', 'Uno');
    c.cargarMasProductos();
    const [sig] = pedidosDeProductos();
    expect(sig.request.params.get('page')).toBe('2');
    sig.flush(pagina([['A-2', 'Dos']], 2, 2));
    expect(c.resultados().map(p => p.sku)).toEqual(['A-1', 'A-2']);
    expect(c.hayMas()).toBe(false);

    // una búsqueda nueva reemplaza la lista, pero el producto elegido sigue con su nombre
    c.busqueda.set('zzz');
    c.buscarProductos();
    pedidosDeProductos()[0].flush(pagina([], 0));
    expect(c.nombreProducto('A-1')).toBe('Uno');
  });

  it('no deja guardar una campaña sin productos', async () => {
    const c = (await montar()).componentInstance;
    c.nueva();
    c.form.name = 'Navidad';
    c.guardar(new Event('submit'));
    expect(c.errores().productos).toBe('Elige al menos un producto para la campaña.');
    ctrl.expectNone('/api/v1/admin/campaigns');
  });

  it('crea una campaña enviando fechas MM-DD y los productos en el orden elegido, sin slug', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    c.nueva();
    c.form.name = 'Día de la Madre';
    c.form.inicio = { dia: 1, mes: 5 };
    c.form.fin = { dia: 10, mes: 5 };
    c.form.evento = { dia: 10, mes: 5 };
    c.alternar('A-1');
    c.alternar('A-2');
    c.mover('A-2', -1);
    const p = c.guardar(new Event('submit'));

    const req = ctrl.expectOne('/api/v1/admin/campaigns');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.start_md).toBe('05-01');
    expect(req.request.body.end_md).toBe('05-10');
    expect(req.request.body.products).toEqual(['A-2', 'A-1']);
    expect(req.request.body.slug).toBeUndefined();
    req.flush(campana({ slug: 'dia-de-la-madre' }), { status: 201, statusText: 'Created' });
    await esperar();
    ctrl.expectOne('/api/v1/admin/campaigns').flush({ data: [] });
    ctrl.expectOne('/api/v1/admin/categories').flush({ data: [] });
    await p;
    expect(c.editando()).toBeNull();
  });

  it('muestra los errores de validación de Laravel y mantiene el formulario abierto', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    c.editar(c.campanas()[0]);
    const p = c.guardar(new Event('submit'));
    const req = ctrl.expectOne('/api/v1/admin/campaigns/san-valentin');
    expect(req.request.method).toBe('PUT');
    req.flush({ code: 'validation_error', message: 'Datos no válidos.', errors: { name: ['Escribe el nombre.'] } }, { status: 422, statusText: 'Unprocessable' });
    await p;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('Escribe el nombre.');
    expect(c.editando()).toBe('san-valentin');
  });

    it('envía el color y el emoji elegidos (o null si no se eligen)', async () => {
        const fixture = await montar();
        const c = fixture.componentInstance;
        c.nueva();
        c.form.name = 'Navidad';
        c.alternar('A-1', 'Uno');
        c.form.color = '#1b5e20';
        c.form.emoji = ' 🎄 ';
        c.guardar(new Event('submit'));
        const req = ctrl.expectOne('/api/v1/admin/campaigns');
        expect(req.request.body.theme_color).toBe('#1b5e20');
        expect(req.request.body.emoji).toBe('🎄');
        req.flush(campana({ slug: 'navidad' }), { status: 201, statusText: 'Created' });
        await esperar();
        ctrl.expectOne('/api/v1/admin/campaigns').flush({ data: [] });
        ctrl.expectOne('/api/v1/admin/categories').flush({ data: [] });

        c.nueva();
        c.form.name = 'Otra';
        c.alternar('A-1', 'Uno');
        c.guardar(new Event('submit'));
        const sin = ctrl.expectOne('/api/v1/admin/campaigns');
        expect(sin.request.body.theme_color).toBeNull();
        expect(sin.request.body.emoji).toBeNull();
        sin.flush({ message: 'x' }, { status: 422, statusText: 'Unprocessable' });
    });

    it('al editar carga el diseño guardado y la vista previa usa su color', async () => {
        const fixture = await montar();
        const c = fixture.componentInstance;
        c.editar({ ...c.campanas()[0], theme_color: '#1b5e20', emoji: '🎄' });
        fixture.detectChanges();

        expect(c.form.color).toBe('#1b5e20');
        expect(c.form.emoji).toBe('🎄');
        expect((fixture.nativeElement.querySelector('.vista-previa .campana') as HTMLElement).style.getPropertyValue('--campana')).toBe('#1b5e20');
    });

  it('con fechas al revés muestra el aviso al instante y no llama a la API al guardar', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    c.nueva();
    c.form.name = 'Navidad';
    c.form.inicio = { dia: 9, mes: 11 };
    c.form.fin = { dia: 8, mes: 11 };
    c.form.evento = { dia: 7, mes: 11 };
    fixture.detectChanges();

    const avisos = Array.from(fixture.nativeElement.querySelectorAll('.campo-error')).map(e => (e as HTMLElement).textContent);
    expect(avisos).toContain('La temporada no puede terminar antes de empezar.');
    expect(avisos).toContain('El evento no puede ser antes de que empiece la temporada.');

    c.guardar(new Event('submit'));
    ctrl.expectNone('/api/v1/admin/campaigns');
    expect(c.guardando()).toBe(false);
  });

  it('nombre y categoría vacíos solo se marcan después de pulsar Guardar, y tampoco llaman a la API', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    c.nueva();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#err-name')).toBeNull();

    c.guardar(new Event('submit'));
    fixture.detectChanges();
    ctrl.expectNone('/api/v1/admin/campaigns');
    expect(fixture.nativeElement.querySelector('#err-name').textContent).toContain('Escribe el nombre');
  });

  it('al guardar envía el mensaje de cierre con su fecha límite (o nulos si está vacío)', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    c.nueva();
    c.form.name = 'Otra';
    c.alternar('A-1', 'Uno');
    c.form.closing_message = '  Otra regresará pronto ';
    c.form.cierra = { dia: 10, mes: 3 };
    c.guardar(new Event('submit'));
    const r = ctrl.expectOne('/api/v1/admin/campaigns');
    expect(r.request.body.closing_message).toBe('Otra regresará pronto');
    expect(r.request.body.closing_until_md).toBe('03-10');
    r.flush({ message: 'x' }, { status: 422, statusText: 'Unprocessable' });

    c.form.closing_message = '';
    c.guardar(new Event('submit'));
    const sin = ctrl.expectOne('/api/v1/admin/campaigns');
    expect(sin.request.body.closing_message).toBeNull();
    expect(sin.request.body.closing_until_md).toBeNull();
    sin.flush({ message: 'x' }, { status: 422, statusText: 'Unprocessable' });
  });

  it('la vista previa muestra la foto o el video de la campaña y el mensaje de cierre', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    c.editar({ ...c.campanas()[0], video_url: 'http://x/v.mp4', closing_message: 'San Valentín regresará pronto', closing_until_md: '03-10' });
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;

    expect(html.querySelector('.vista-previa video.campana-portada')?.getAttribute('src')).toBe('http://x/v.mp4');
    expect(html.querySelector('.vista-previa .boton')).not.toBeNull();

    c.vistaCierre.set(true);
    fixture.detectChanges();
    expect(html.querySelector('.vista-previa h2')?.textContent).toContain('San Valentín regresará pronto');
    expect(html.querySelector('.vista-previa .boton')).toBeNull();
  });

  it('normaliza los códigos Hex escritos a mano', () => {
    expect(normalizarHex('#C2185B')).toBe('#c2185b');
    expect(normalizarHex(' c2185b ')).toBe('#c2185b');
    expect(normalizarHex('#c15')).toBe('#cc1155');
    expect(normalizarHex('#c2185')).toBeNull();
    expect(normalizarHex('rojo')).toBeNull();
  });

  it('al escribir un Hex válido cambia el color; uno incompleto avisa y no lo cambia', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    c.nueva();
    c.escribirHex('1B5E20');
    expect(c.form.color).toBe('#1b5e20');
    expect(c.errores().color).toBeUndefined();

    c.escribirHex('#1B5E');
    expect(c.form.color).toBe('#1b5e20');
    expect(c.errores().color).toContain('código Hex');

    c.escribirHex('');
    expect(c.form.color).toBe('');
    expect(c.errores().color).toBeUndefined();
  });

  it('al cambiar el nombre al editar avisa que la dirección nueva sustituye a la anterior', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    c.editar({ ...c.campanas()[0], slug: 'san-valentin', name: 'San Valentín' });
    expect(c.cambiaDireccion()).toBe(false);

    c.form.name = 'San Valentín 2027';
    fixture.detectChanges();
    expect(c.slugMostrado()).toBe('san-valentin-2027');
    expect(c.cambiaDireccion()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('/san-valentin-2027');
  });
});
