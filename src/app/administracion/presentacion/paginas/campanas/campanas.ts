import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { CampanasAdminService } from '../../../aplicacion/servicios/CampanasAdminService';
import { CategoriasAdminService } from '../../../aplicacion/servicios/CategoriasAdminService';
import { ProductosAdminService } from '../../../aplicacion/servicios/ProductosAdminService';
import { CampanaAdmin } from '../../../dominio/interfaces/campana-admin';
import { CategoriaAdmin } from '../../../dominio/interfaces/categoria-admin';
import { ProductoAdmin } from '../../../dominio/interfaces/producto-admin';
import { generarSlug } from '../../../aplicacion/slug';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const DIAS = Array.from({ length: 31 }, (_, i) => i + 1);

/** "05-10" → { dia: 10, mes: 5 }. */
export function leerFechaAnual(md: string): { dia: number; mes: number } {
  const [mes, dia] = md.split('-').map(Number);
  return { dia: dia || 1, mes: mes || 1 };
}

/** { dia: 10, mes: 5 } → "05-10" (lo que espera Laravel). */
export function aFechaAnual(f: { dia: number; mes: number }): string {
  return `${String(f.mes).padStart(2, '0')}-${String(f.dia).padStart(2, '0')}`;
}

/** "05-10" → "10 de mayo". */
export function textoFechaAnual(md: string): string {
  const f = leerFechaAnual(md);
  return `${f.dia} de ${MESES[f.mes - 1]}`;
}

interface Fecha { dia: number; mes: number }
interface Formulario {
  name: string; related_category: string; inicio: Fecha; fin: Fecha; evento: Fecha;
  tagline: string; slogan: string; seo_title: string; seo_description: string; is_active: boolean;
}

const VACIO: Formulario = {
  name: '', related_category: '', inicio: { dia: 1, mes: 1 }, fin: { dia: 14, mes: 2 }, evento: { dia: 14, mes: 2 },
  tagline: '', slogan: '', seo_title: '', seo_description: '', is_active: true,
};

// Campañas de temporada en el panel (San Valentín, Día de la Madre…). Angular solo muestra lo que Laravel responde:
// si la campaña está en temporada y de qué año lo calcula Laravel con la fecha de hoy.
@Component({
  selector: 'app-admin-campanas',
  imports: [FormsModule, RouterLink],
  templateUrl: './campanas.html',
  styleUrl: './campanas.css',
})
export class AdminCampanas implements OnInit {
  private servicio = inject(CampanasAdminService);
  private categoriasApi = inject(CategoriasAdminService);
  private productosApi = inject(ProductosAdminService);
  private avisos = inject(AvisosService);

  readonly meses = MESES;
  readonly dias = DIAS;
  readonly textoFecha = textoFechaAnual;

  campanas = signal<CampanaAdmin[]>([]);
  categorias = signal<CategoriaAdmin[]>([]);
  productos = signal<ProductoAdmin[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  /** null = formulario cerrado; '' = nueva; otro valor = slug de la que se edita. */
  editando = signal<string | null>(null);
  form: Formulario = structuredClone(VACIO);
  slugActual = '';
  /** SKU de los productos elegidos, en el orden en que se mostrarán. */
  elegidos = signal<string[]>([]);
  porEliminar = signal<string | null>(null);

  error = signal('');
  detalle = signal<string[]>([]);

  constructor() {
    inject(Title).setTitle('Campañas | Panel de Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      const [campanas, categorias, productos] = await Promise.all([this.servicio.listar(), this.categoriasApi.listar(), this.productosApi.listar()]);
      this.campanas.set(campanas);
      this.categorias.set(categorias);
      this.productos.set(productos);
    } catch (e) {
      this.error.set((e as ErrorApi).message);
    } finally {
      this.cargando.set(false);
    }
  }

  nueva(): void {
    this.limpiar();
    this.slugActual = '';
    this.form = structuredClone(VACIO);
    this.elegidos.set([]);
    this.editando.set('');
  }

  editar(c: CampanaAdmin): void {
    this.limpiar();
    this.slugActual = c.slug;
    this.form = {
      name: c.name, related_category: c.related_category.slug,
      inicio: leerFechaAnual(c.start_md), fin: leerFechaAnual(c.end_md), evento: leerFechaAnual(c.event_md),
      tagline: c.tagline ?? '', slogan: c.slogan ?? '', seo_title: c.seo_title ?? '', seo_description: c.seo_description ?? '', is_active: c.is_active,
    };
    this.elegidos.set(c.products.map(p => p.sku));
    this.editando.set(c.slug);
  }

  cancelar(): void {
    this.editando.set(null);
    this.limpiar();
  }

  // ----- Productos elegidos (el orden es el de la página) -----
  estaElegido(sku: string): boolean {
    return this.elegidos().includes(sku);
  }

  alternar(sku: string): void {
    this.elegidos.update(l => l.includes(sku) ? l.filter(s => s !== sku) : [...l, sku]);
  }

  mover(sku: string, sentido: -1 | 1): void {
    this.elegidos.update(l => {
      const i = l.indexOf(sku);
      const j = i + sentido;
      if (i < 0 || j < 0 || j >= l.length) return l;
      const copia = [...l];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });
  }

  nombreProducto(sku: string): string {
    return this.productos().find(p => p.sku === sku)?.name ?? sku;
  }

  async guardar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (this.guardando() || this.editando() === null) return;
    this.error.set('');
    this.detalle.set([]);
    this.guardando.set(true);
    const datos = {
      name: this.form.name.trim(),
      related_category: this.form.related_category,
      start_md: aFechaAnual(this.form.inicio),
      end_md: aFechaAnual(this.form.fin),
      event_md: aFechaAnual(this.form.evento),
      tagline: this.form.tagline.trim() || null,
      slogan: this.form.slogan.trim() || null,
      is_active: this.form.is_active,
      seo_title: this.form.seo_title.trim() || null,
      seo_description: this.form.seo_description.trim() || null,
      products: this.elegidos(),
    };
    try {
      const slug = this.editando()!;
      if (slug === '') {
        await this.servicio.crear(datos); // la dirección la genera Laravel a partir del nombre
        this.avisos.exito('Campaña creada.');
      } else {
        await this.servicio.editar(slug, datos);
        this.avisos.exito('Cambios guardados.');
      }
      this.editando.set(null);
      await this.cargar();
    } catch (e) {
      const err = e as ErrorApi;
      this.error.set(err.message);
      this.detalle.set(Object.values(err.errors ?? {}).flat());
    } finally {
      this.guardando.set(false);
    }
  }

  /** La dirección que se mostrará: la guardada al editar, o la vista previa del nombre al crear. */
  slugMostrado(): string {
    return this.editando() === '' ? generarSlug(this.form.name) : this.slugActual;
  }

  pedirEliminar(slug: string): void {
    this.limpiar();
    this.porEliminar.set(slug);
  }

  async eliminar(slug: string): Promise<void> {
    this.porEliminar.set(null);
    try {
      await this.servicio.eliminar(slug);
      this.avisos.exito('Campaña eliminada.');
      await this.cargar();
    } catch (e) {
      this.error.set((e as ErrorApi).message);
    }
  }

  private limpiar(): void {
    this.error.set('');
    this.detalle.set([]);
    this.porEliminar.set(null);
  }
}
