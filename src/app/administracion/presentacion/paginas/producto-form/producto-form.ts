import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
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
  description_html: string; is_available: boolean; is_active: boolean;
}

const VACIO: Formulario = {
  name: '', type: 'personalizable', category: '', subcategory: '', precio: '', costo: '', descuento: '', size_text: '',
  material_text: '', incluye: '', description_html: '', is_available: true, is_active: true,
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
export class AdminProductoForm implements OnInit, OnDestroy {
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
  private pedidoSub = 0;
  precioFinal = signal<PrevisualizacionPrecio | null>(null);
  cargando = signal(true);
  guardando = signal(false);
  error = signal('');
  detalle = signal<string[]>([]);
  errores = signal<Record<string, string>>({});

  private temporizador: ReturnType<typeof setTimeout> | null = null;
  private consulta = 0;

  constructor() {
    inject(Title).setTitle('Producto | Panel de Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  async ngOnInit(): Promise<void> {
    try {
      this.categorias.set(await this.categoriasApi.listar());
      if (this.sku) {
        const p = await this.productosApi.ver(this.sku);
        this.slugActual = p.slug;
        this.skuMostrado.set(p.sku);
        this.form = this.aFormulario(p);
        await this.cargarSubcategorias();
        this.verPrecio();
      } else {
        this.productosApi.siguienteSku().then(s => this.skuMostrado.set(s), () => this.skuMostrado.set(''));
      }
    } catch (e) {
      this.error.set((e as ErrorApi).message);
    } finally {
      this.cargando.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.temporizador) clearTimeout(this.temporizador);
  }

  slugMostrado(): string {
    return this.esNuevo ? generarSlug(this.form.name) : this.slugActual;
  }

  /** Al cambiar la categoría se piden sus subcategorías y se limpia la elegida. */
  async cambiarCategoria(): Promise<void> {
    this.form.subcategory = '';
    await this.cargarSubcategorias();
  }

  private async cargarSubcategorias(): Promise<void> {
    const pedido = ++this.pedidoSub;
    this.subcategoriasListas.set(false);
    this.subcategorias.set([]);
    if (!this.form.category) return this.cargandoSubcategorias.set(false);
    this.cargandoSubcategorias.set(true);
    let lista: SubcategoriaAdmin[] = [];
    try {
      lista = await this.subcategoriasApi.listar(this.form.category);
    } catch {
      lista = [];
    }
    if (pedido !== this.pedidoSub) return; // llegó una respuesta vieja: otra categoría ya fue elegida
    this.subcategorias.set(lista);
    this.subcategoriasListas.set(true);
    this.cargandoSubcategorias.set(false);
  }

  /** Pide a Laravel cuánto sería el descuento en dinero (con una pequeña espera mientras la persona escribe). */
  verPrecio(): void {
    if (this.temporizador) clearTimeout(this.temporizador);
    const base = dolaresACentavos(this.form.precio);
    const porcentaje = leerDescuento(this.form.descuento);
    if (base === null || porcentaje === null || porcentaje === 0) {
      this.consulta++;
      this.precioFinal.set(null);
      return;
    }
    const numero = ++this.consulta;
    this.temporizador = setTimeout(async () => {
      try {
        const r = await this.productosApi.previsualizarPrecio(base, porcentaje);
        if (numero === this.consulta) this.precioFinal.set(r); // se ignoran respuestas viejas
      } catch {
        if (numero === this.consulta) this.precioFinal.set(null);
      }
    }, 300);
  }

  /** El aviso rojo de un campo desaparece apenas la persona lo corrige. */
  quitarError(campo: string): void {
    if (!this.errores()[campo]) return;
    this.errores.update(e => Object.fromEntries(Object.entries(e).filter(([k]) => k !== campo)));
  }

  dolares(centavos: number): string {
    return centavosADolares(centavos);
  }

  async guardar(evento: Event): Promise<void> {
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
    this.errores.set(errores);
    if (Object.keys(errores).length) return; // no se llama a la API con datos incompletos

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
      is_available: this.form.is_available,
      is_active: this.form.is_active,
    };

    this.guardando.set(true);
    try {
      if (this.esNuevo) {
        const creado = await this.productosApi.crear(datos);
        this.avisos.exito(`Producto creado con el código ${creado.sku}.`);
      } else {
        await this.productosApi.editar(this.sku!, datos);
        this.avisos.exito('Cambios guardados.');
      }
      await this.router.navigate(['/admin/productos']);
    } catch (e) {
      const err = e as Partial<ErrorApi>;
      this.error.set(err.message || 'No pudimos guardar el producto. Inténtalo de nuevo.');
      this.detalle.set(Object.values(err.errors ?? {}).flat());
    } finally {
      this.guardando.set(false);
    }
  }

  private aFormulario(p: ProductoAdmin): Formulario {
    return {
      name: p.name, type: p.type, category: p.category_slug, subcategory: p.subcategory_slug ?? '',
      precio: centavosADolares(p.base_price_cents), costo: p.cost_cents === null ? '' : centavosADolares(p.cost_cents),
      descuento: p.discount_percent > 0 ? String(p.discount_percent) : '',
      size_text: p.size_text ?? '', material_text: p.material_text ?? '', incluye: p.includes.join('\n'),
      description_html: p.description_html ?? '', is_available: p.is_available, is_active: p.is_active,
    };
  }
}
