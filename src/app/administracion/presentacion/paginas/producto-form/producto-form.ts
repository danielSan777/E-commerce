import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CategoriasAdminService } from '../../../aplicacion/servicios/CategoriasAdminService';
import { ProductosAdminService } from '../../../aplicacion/servicios/ProductosAdminService';
import { SubcategoriasAdminService } from '../../../aplicacion/servicios/SubcategoriasAdminService';
import { centavosADolares, dolaresACentavos } from '../../../aplicacion/dinero';
import { generarSlug } from '../../../aplicacion/slug';
import { CategoriaAdmin, SubcategoriaAdmin } from '../../../dominio/interfaces/categoria-admin';
import { DatosProducto, ProductoAdmin } from '../../../dominio/interfaces/producto-admin';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';

interface Formulario {
  name: string; sku: string; type: 'personalizable' | 'complemento'; category: string; subcategory: string;
  precio: string; costo: string; size_text: string; material_text: string; incluye: string;
  description_html: string; is_available: boolean; is_active: boolean;
}

const VACIO: Formulario = {
  name: '', sku: '', type: 'personalizable', category: '', subcategory: '', precio: '', costo: '', size_text: '',
  material_text: '', incluye: '', description_html: '', is_available: true, is_active: true,
};

// Crear o editar un producto. La persona escribe dólares; se envían centavos enteros. Laravel valida y calcula todo.
@Component({
  selector: 'app-admin-producto-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './producto-form.html',
  styleUrl: './producto-form.css',
})
export class AdminProductoForm implements OnInit {
  private productosApi = inject(ProductosAdminService);
  private categoriasApi = inject(CategoriasAdminService);
  private subcategoriasApi = inject(SubcategoriasAdminService);
  private router = inject(Router);

  /** SKU del producto que se edita; null = producto nuevo. */
  readonly sku = inject(ActivatedRoute).snapshot.paramMap.get('sku');
  readonly esNuevo = this.sku === null;

  form: Formulario = { ...VACIO };
  slugActual = '';
  categorias = signal<CategoriaAdmin[]>([]);
  subcategorias = signal<SubcategoriaAdmin[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  error = signal('');
  detalle = signal<string[]>([]);
  errores = signal<Record<string, string>>({});

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
        this.form = this.aFormulario(p);
        await this.cargarSubcategorias();
      }
    } catch (e) {
      this.error.set((e as ErrorApi).message);
    } finally {
      this.cargando.set(false);
    }
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
    if (!this.form.category) return this.subcategorias.set([]);
    try {
      this.subcategorias.set(await this.subcategoriasApi.listar(this.form.category));
    } catch {
      this.subcategorias.set([]);
    }
  }

  async guardar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (this.guardando()) return;
    this.error.set('');
    this.detalle.set([]);

    const errores: Record<string, string> = {};
    if (!this.form.name.trim()) errores['name'] = 'Escribe el nombre del producto.';
    if (!this.form.category) errores['category'] = 'Elige la categoría.';
    const precio = dolaresACentavos(this.form.precio);
    if (precio === null) errores['precio'] = 'Escribe un precio válido, por ejemplo 21.50.';
    const costo = this.form.costo.trim() ? dolaresACentavos(this.form.costo) : null;
    if (this.form.costo.trim() && costo === null) errores['costo'] = 'Escribe un costo válido, por ejemplo 9.00, o déjalo vacío.';
    this.errores.set(errores);
    if (Object.keys(errores).length) return; // no se llama a la API con datos incompletos

    const datos: Omit<DatosProducto, 'sku'> = {
      name: this.form.name.trim(),
      type: this.form.type,
      category: this.form.category,
      subcategory: this.form.subcategory || null,
      base_price_cents: precio!,
      cost_cents: costo,
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
        const sku = this.form.sku.trim().toUpperCase();
        await this.productosApi.crear({ ...datos, ...(sku ? { sku } : {}) });
      } else {
        await this.productosApi.editar(this.sku!, datos);
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
      name: p.name, sku: p.sku, type: p.type, category: p.category_slug, subcategory: p.subcategory_slug ?? '',
      precio: centavosADolares(p.base_price_cents), costo: p.cost_cents === null ? '' : centavosADolares(p.cost_cents),
      size_text: p.size_text ?? '', material_text: p.material_text ?? '', incluye: p.includes.join('\n'),
      description_html: p.description_html ?? '', is_available: p.is_available, is_active: p.is_active,
    };
  }
}
