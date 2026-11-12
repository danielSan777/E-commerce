import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, Subject, Subscription, catchError, finalize, from, map, of, switchMap, tap, timer } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { CategoriasAdminService } from '../../../aplicacion/servicios/CategoriasAdminService';
import { ProductosAdminService } from '../../../aplicacion/servicios/ProductosAdminService';
import { SubcategoriasAdminService } from '../../../aplicacion/servicios/SubcategoriasAdminService';
import { centavosADolares, dolaresACentavos } from '../../../aplicacion/dinero';
import { generarSlug } from '../../../aplicacion/slug';
import { CategoriaAdmin, SubcategoriaAdmin } from '../../../dominio/interfaces/categoria-admin';
import { DatosProducto, PrevisualizacionPrecio, ProductoAdmin } from '../../../dominio/interfaces/producto-admin';
import { GaleriaImagenes } from '../../componentes/galeria-imagenes/galeria-imagenes';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';

interface Formulario {
  name: string; type: 'personalizable' | 'complemento'; category: string; subcategory: string;
  precio: string; costo: string; descuento: string; size_text: string; material_text: string; incluye: string;
  description_html: string; seo_title: string; seo_description: string; is_available: boolean; is_active: boolean;
}

/** Lo mismo que valida Laravel. El título se recomienda hasta 60: Google suele cortarlo ahí. */
export const MAX_DESCRIPCION_GOOGLE = 320;
export const MAX_TITULO_GOOGLE = 60;

const VACIO: Formulario = {
  name: '', type: 'personalizable', category: '', subcategory: '', precio: '', costo: '', descuento: '', size_text: '',
  material_text: '', incluye: '', description_html: '', seo_title: '', seo_description: '', is_available: true, is_active: true,
};

const DESCUENTO_MAXIMO = 90; // el mismo tope que valida Laravel (config/catalogo.php)

/** "10", "12.5", "12,5" → número entre 0 y 90 con hasta dos decimales; vacío = 0; null si no es válido. Solo valida: el cálculo en dinero lo hace Laravel. */
export function leerDescuento(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.');
  if (limpio === '') return 0;
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(limpio)) return null;
  const numero = Number(limpio);
  return numero <= DESCUENTO_MAXIMO ? numero : null;
}

// Crear o editar un producto. La persona escribe dólares; se envían centavos enteros. Laravel valida y calcula todo
// (código SKU, descuento en dinero y precio final); aquí solo se muestran.
@Component({
  selector: 'app-admin-producto-form',
  imports: [FormsModule, RouterLink, GaleriaImagenes],
  templateUrl: './producto-form.html',
  styleUrl: './producto-form.css',
})
export class AdminProductoForm implements OnInit {
  private productosApi = inject(ProductosAdminService);
  private categoriasApi = inject(CategoriasAdminService);
  private subcategoriasApi = inject(SubcategoriasAdminService);
  private router = inject(Router);
  private avisos = inject(AvisosService);

  /** SKU del producto que se edita; null = producto nuevo. */
  readonly sku = inject(ActivatedRoute).snapshot.paramMap.get('sku');
  readonly esNuevo = this.sku === null;

  form: Formulario = { ...VACIO };
  slugActual = '';
  /** Código que se muestra (solo lectura): el del producto, o el que recibiría el nuevo. */
  skuMostrado = signal('');
  categorias = signal<CategoriaAdmin[]>([]);
  subcategorias = signal<SubcategoriaAdmin[]>([]);
  subcategoriasListas = signal(false);
  /** true mientras Laravel responde las subcategorías de la categoría elegida. */
  cargandoSubcategorias = signal(false);
  precioFinal = signal<PrevisualizacionPrecio | null>(null);
  cargando = signal(true);
  guardando = signal(false);
  error = signal('');
  detalle = signal<string[]>([]);
  errores = signal<Record<string, string>>({});

  /** Imagen para personalizar: la foto recién elegida o, al editar, la que ya tiene el producto. */
  archivoBase: File | null = null;
  vistaPreviaBase = signal<string | null>(null);
  private imagenGuardada: string | null = null;

  private destroyRef = inject(DestroyRef);
  /** Consultas de precio: `switchMap` descarta la anterior (espera y petición) cuando llega una nueva. */
  private consultaPrecio$ = new Subject<{ base: number; porcentaje: number } | null>();
  private subcategoriasPendientes?: Subscription;

  constructor() {
    inject(Title).setTitle('Producto | Panel de Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
    this.consultaPrecio$.pipe(
      // Pequeña espera mientras la persona escribe; Laravel calcula el descuento.
      switchMap(c => c === null ? of(null) : timer(300).pipe(
        switchMap(() => this.productosApi.previsualizarPrecio(c.base, c.porcentaje)),
        catchError(() => of(null)),
      )),
      takeUntilDestroyed(),
    ).subscribe(r => this.precioFinal.set(r));
  }

  ngOnInit(): void {
    this.categoriasApi.listar().pipe(
      tap(lista => this.categorias.set(lista)),
      switchMap(() => {
        if (!this.sku) {
          // Solo informativo: si falla, el código simplemente no se muestra.
          this.productosApi.siguienteSku().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: s => this.skuMostrado.set(s), error: () => this.skuMostrado.set('') });
          return of(undefined);
        }
        return this.productosApi.ver(this.sku).pipe(
          tap(p => {
            this.slugActual = p.slug;
            this.skuMostrado.set(p.sku);
            this.form = this.aFormulario(p);
            this.imagenGuardada = p.personalization_image ?? null;
            this.vistaPreviaBase.set(this.imagenGuardada);
          }),
          switchMap(() => this.subcategoriasDeLaCategoria()),
          tap(() => this.verPrecio()),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando.set(false)),
    ).subscribe({ error: (e: ErrorApi) => this.error.set(e.message) });
  }

  slugMostrado(): string {
    return this.esNuevo ? generarSlug(this.form.name) : this.slugActual;
  }

  /** Al cambiar la categoría se piden sus subcategorías y se limpia la elegida. */
  cambiarCategoria(): void {
    this.form.subcategory = '';
    this.subcategoriasPendientes?.unsubscribe(); // si llega otra elección, la respuesta vieja se descarta
    this.subcategoriasPendientes = this.subcategoriasDeLaCategoria().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  private subcategoriasDeLaCategoria(): Observable<void> {
    this.subcategoriasListas.set(false);
    this.subcategorias.set([]);
    if (!this.form.category) {
      this.cargandoSubcategorias.set(false);
      return of(undefined);
    }
    this.cargandoSubcategorias.set(true);
    return this.subcategoriasApi.listar(this.form.category).pipe(
      catchError(() => of([] as SubcategoriaAdmin[])),
      tap(lista => {
        this.subcategorias.set(lista);
        this.subcategoriasListas.set(true);
        this.cargandoSubcategorias.set(false);
      }),
      map(() => undefined),
    );
  }

  /** Pide a Laravel cuánto sería el descuento en dinero (con una pequeña espera mientras la persona escribe). */
  verPrecio(): void {
    const base = dolaresACentavos(this.form.precio);
    const porcentaje = leerDescuento(this.form.descuento);
    this.consultaPrecio$.next(base === null || porcentaje === null || porcentaje === 0 ? null : { base, porcentaje });
  }

  readonly maxTitulo = MAX_TITULO_GOOGLE;
  readonly maxDescripcion = MAX_DESCRIPCION_GOOGLE;

  /** Cómo se vería en Google si se deja vacío: "Nombre | Jardín de Sele". */
  tituloVistaPrevia(): string {
    return this.form.seo_title.trim() || (this.form.name.trim() ? `${this.form.name.trim()} | Jardín de Sele` : '');
  }

  /** El aviso rojo de un campo desaparece apenas la persona lo corrige. */
  quitarError(campo: string): void {
    if (!this.errores()[campo]) return;
    this.errores.update(e => Object.fromEntries(Object.entries(e).filter(([k]) => k !== campo)));
  }

  /** El producto personalizable necesita su imagen para personalizar; el complemento no. */
  get pideImagenBase(): boolean {
    return this.form.type === 'personalizable';
  }

  elegirImagenBase(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    this.archivoBase = campo.files?.[0] ?? null;
    const anterior = this.vistaPreviaBase();
    if (anterior?.startsWith('blob:')) URL.revokeObjectURL(anterior);
    this.vistaPreviaBase.set(this.archivoBase ? URL.createObjectURL(this.archivoBase) : this.imagenGuardada);
    if (this.archivoBase) this.quitarError('imagen');
  }

  dolares(centavos: number): string {
    return centavosADolares(centavos);
  }

  guardar(evento: Event): void {
    evento.preventDefault();
    if (this.guardando()) return;
    this.error.set('');
    this.detalle.set([]);

    const errores: Record<string, string> = {};
    if (!this.form.name.trim()) errores['name'] = 'Escribe el nombre del producto.';
    if (!this.form.category) errores['category'] = 'Elige la categoría.';
    if (this.form.category && this.subcategoriasListas() && this.subcategorias().length === 0) {
      errores['subcategory'] = 'Esta categoría todavía no tiene subcategorías. Crea una primero.';
    } else if (!this.form.subcategory) {
      errores['subcategory'] = 'Elige la subcategoría.';
    }
    const precio = dolaresACentavos(this.form.precio);
    if (precio === null) errores['precio'] = 'Escribe un precio válido, por ejemplo 21.50.';
    const costo = this.form.costo.trim() ? dolaresACentavos(this.form.costo) : null;
    if (this.form.costo.trim() && costo === null) errores['costo'] = 'Escribe un costo válido, por ejemplo 9.00, o déjalo vacío.';
    const descuento = leerDescuento(this.form.descuento);
    if (descuento === null) errores['descuento'] = `Escribe un descuento entre 0 y ${DESCUENTO_MAXIMO}, por ejemplo 10 o 12.5, o déjalo vacío.`;
    // La imagen para personalizar es obligatoria. Al editar basta con que el producto ya la tenga, o con que esté inactivo.
    if (this.pideImagenBase && !this.archivoBase && (this.esNuevo || (!this.imagenGuardada && this.form.is_active))) {
      errores['imagen'] = this.esNuevo ? 'Sube la imagen para personalizar: es obligatoria.' : 'Sube la imagen para personalizar antes de dejar el producto activo.';
    }
    this.errores.set(errores);
    if (Object.keys(errores).length) return this.avisos.faltanDatos(); // no se llama a la API con datos incompletos

    const datos: DatosProducto = {
      name: this.form.name.trim(),
      type: this.form.type,
      category: this.form.category,
      subcategory: this.form.subcategory,
      base_price_cents: precio!,
      cost_cents: costo,
      discount_percent: descuento!,
      size_text: this.form.size_text.trim() || null,
      material_text: this.form.material_text.trim() || null,
      includes: this.form.incluye.split('\n').map(l => l.trim()).filter(Boolean),
      description_html: this.form.description_html.trim() || null,
      seo_title: this.form.seo_title.trim() || null,
      seo_description: this.form.seo_description.trim() || null,
      is_available: this.form.is_available,
      is_active: this.form.is_active,
    };

    this.guardando.set(true);
    const imagen = this.pideImagenBase ? this.archivoBase : null;
    const peticion = this.esNuevo ? this.crearProducto(datos, imagen) : this.editarProducto(datos, imagen);
    peticion.pipe(
      switchMap(() => from(this.router.navigate(['/admin/productos']))),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.guardando.set(false)),
    ).subscribe({
      error: (err: Partial<ErrorApi>) => {
        this.error.set(err.message || 'No pudimos guardar el producto. Inténtalo de nuevo.');
        this.detalle.set(Object.values(err.errors ?? {}).flat());
      },
    });
  }

  /**
   * Producto nuevo. Un personalizable no puede estar activo sin su imagen, así que se crea inactivo, se sube la imagen
   * y solo entonces se activa (si la persona lo dejó activo). Si la imagen falla el producto queda inactivo y se
   * continúa en su pantalla de edición para volver a intentarlo.
   */
  private crearProducto(datos: DatosProducto, imagen: File | null): Observable<unknown> {
    if (!imagen) {
      return this.productosApi.crear(datos).pipe(tap(creado => this.avisos.exito(`Producto creado con el código ${creado.sku}.`)));
    }
    return this.productosApi.crear({ ...datos, is_active: false }).pipe(
      switchMap(creado => this.productosApi.subirImagenParaPersonalizar(creado.sku, imagen).pipe(
        catchError((err: Partial<ErrorApi>) => {
          this.avisos.error(`El producto se creó con el código ${creado.sku}, pero la imagen no se pudo subir: ${err.errors?.['image']?.[0] ?? err.message ?? 'inténtalo de nuevo'}. Súbela al editarlo.`);
          return from(this.router.navigate(['/admin/productos', creado.sku])).pipe(switchMap(() => EMPTY));
        }),
        switchMap(() => datos.is_active ? this.productosApi.editar(creado.sku, datos) : of(creado)),
        tap(() => this.avisos.exito(`Producto creado con el código ${creado.sku}.`)),
      )),
    );
  }

  /** Al editar, la imagen nueva (si se eligió) se sube primero: así el producto puede quedar activo. */
  private editarProducto(datos: DatosProducto, imagen: File | null): Observable<unknown> {
    const subida: Observable<unknown> = imagen ? this.productosApi.subirImagenParaPersonalizar(this.sku!, imagen) : of(null);
    return subida.pipe(
      switchMap(() => this.productosApi.editar(this.sku!, datos)),
      tap(() => this.avisos.exito('Cambios guardados.')),
    );
  }

  private aFormulario(p: ProductoAdmin): Formulario {
    return {
      name: p.name, type: p.type, category: p.category_slug, subcategory: p.subcategory_slug ?? '',
      precio: centavosADolares(p.base_price_cents), costo: p.cost_cents === null ? '' : centavosADolares(p.cost_cents),
      descuento: p.discount_percent > 0 ? String(p.discount_percent) : '',
      size_text: p.size_text ?? '', material_text: p.material_text ?? '', incluye: p.includes.join('\n'),
      description_html: p.description_html ?? '', seo_title: p.seo_title ?? '', seo_description: p.seo_description ?? '', is_available: p.is_available, is_active: p.is_active,
    };
  }
}
