import { Component, OnInit, inject, signal } from '@angular/core';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { CategoriasAdminService } from '../../../aplicacion/servicios/CategoriasAdminService';
import { CategoriaAdmin } from '../../../dominio/interfaces/categoria-admin';
import { generarSlug } from '../../../aplicacion/slug';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';

interface Formulario { name: string; headline: string; sort_order: number; is_active: boolean }

const VACIO: Formulario = { name: '', headline: '', sort_order: 0, is_active: true };

// Categorías en el panel. Angular solo muestra lo que Laravel responde y sus mensajes (validación, 409 con productos).
@Component({
  selector: 'app-admin-categorias',
  imports: [FormsModule, RouterLink],
  templateUrl: './categorias.html',
  styleUrl: './categorias.css',
})
export class AdminCategorias implements OnInit {
  private servicio = inject(CategoriasAdminService);

  categorias = signal<CategoriaAdmin[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  /** null = formulario cerrado; '' = nueva categoría; otro valor = slug de la que se edita. */
  editando = signal<string | null>(null);
  form: Formulario = { ...VACIO };
  /** Slug de la categoría que se edita (no cambia). Al crear no se usa: se muestra la vista previa. */
  slugActual = '';
  /** Pidió eliminar esta categoría y falta confirmar. */
  porEliminar = signal<string | null>(null);

  error = signal('');
  detalle = signal<string[]>([]);
  aviso = signal('');
  private avisos = inject(AvisosService);
  /** Respuesta 409: la categoría tiene productos y no se borró. */
  bloqueada = signal<{ slug: string; message: string; products: NonNullable<ErrorApi['products']> } | null>(null);

  constructor() {
    inject(Title).setTitle('Categorías | Panel de Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      this.categorias.set(await this.servicio.listar());
    } catch (e) {
      this.error.set((e as ErrorApi).message);
    } finally {
      this.cargando.set(false);
    }
  }

  nueva(): void {
    this.limpiar();
    this.slugActual = '';
    this.form = { ...VACIO, sort_order: this.categorias().length + 1 };
    this.editando.set('');
  }

  editar(c: CategoriaAdmin): void {
    this.limpiar();
    this.slugActual = c.slug;
    this.form = { name: c.name, headline: c.headline ?? '', sort_order: c.sort_order, is_active: c.is_active };
    this.editando.set(c.slug);
  }

  cancelar(): void {
    this.editando.set(null);
    this.limpiar();
  }

  async guardar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (this.guardando() || this.editando() === null) return;
    this.error.set('');
    this.detalle.set([]);
    this.guardando.set(true);
    const base = { name: this.form.name.trim(), headline: this.form.headline.trim() || null, sort_order: Number(this.form.sort_order), is_active: this.form.is_active };
    try {
      const slug = this.editando()!;
      if (slug === '') {
        await this.servicio.crear(base); // el slug lo genera Laravel a partir del nombre
        this.aviso.set('Categoría creada.');
        this.avisos.exito('Categoría creada.');
      } else {
        await this.servicio.editar(slug, base);
        this.aviso.set('Cambios guardados.');
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

  /** El identificador que se mostrará: el guardado al editar, o la vista previa del nombre al crear. */
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
      this.aviso.set('Categoría eliminada.');
      this.avisos.exito('Categoría eliminada.');
      await this.cargar();
    } catch (e) {
      const err = e as ErrorApi;
      if (err.code === 'category_has_products') {
        this.bloqueada.set({ slug, message: err.message, products: err.products ?? [] });
      } else {
        this.error.set(err.message);
      }
    }
  }

  private limpiar(): void {
    this.error.set('');
    this.detalle.set([]);
    this.aviso.set('');
    this.bloqueada.set(null);
    this.porEliminar.set(null);
  }
}
