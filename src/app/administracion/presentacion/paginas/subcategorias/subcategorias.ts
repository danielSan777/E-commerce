import { Component, OnInit, inject, signal } from '@angular/core';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SubcategoriasAdminService } from '../../../aplicacion/servicios/SubcategoriasAdminService';
import { SubcategoriaAdmin } from '../../../dominio/interfaces/categoria-admin';
import { generarSlug } from '../../../aplicacion/slug';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';

interface Formulario { name: string; sort_order: number; is_active: boolean }
const VACIO: Formulario = { name: '', sort_order: 0, is_active: true };

// Subcategorías de una categoría, en el panel. Angular solo muestra lo que Laravel responde y sus mensajes.
@Component({
  selector: 'app-admin-subcategorias',
  imports: [FormsModule, RouterLink],
  templateUrl: './subcategorias.html',
  styleUrl: './subcategorias.css',
})
export class AdminSubcategorias implements OnInit {
  private servicio = inject(SubcategoriasAdminService);
  readonly categoria = inject(ActivatedRoute).snapshot.paramMap.get('slug') ?? '';

  lista = signal<SubcategoriaAdmin[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  /** null = formulario cerrado; '' = nueva; otro valor = slug de la que se edita. */
  editando = signal<string | null>(null);
  form: Formulario = { ...VACIO };
  slugActual = '';
  porEliminar = signal<string | null>(null);

  error = signal('');
  detalle = signal<string[]>([]);
  aviso = signal('');
  private avisos = inject(AvisosService);
  bloqueada = signal<{ slug: string; message: string; products: NonNullable<ErrorApi['products']> } | null>(null);

  constructor() {
    inject(Title).setTitle('Subcategorías | Panel de Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      this.lista.set(await this.servicio.listar(this.categoria));
    } catch (e) {
      this.error.set((e as ErrorApi).message);
    } finally {
      this.cargando.set(false);
    }
  }

  nueva(): void {
    this.limpiar();
    this.slugActual = '';
    this.form = { ...VACIO, sort_order: this.lista().length + 1 };
    this.editando.set('');
  }

  editar(s: SubcategoriaAdmin): void {
    this.limpiar();
    this.slugActual = s.slug;
    this.form = { name: s.name, sort_order: s.sort_order, is_active: s.is_active };
    this.editando.set(s.slug);
  }

  cancelar(): void {
    this.editando.set(null);
    this.limpiar();
  }

  slugMostrado(): string {
    return this.editando() === '' ? generarSlug(this.form.name) : this.slugActual;
  }

  async guardar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (this.guardando() || this.editando() === null) return;
    this.error.set('');
    this.detalle.set([]);
    this.guardando.set(true);
    const datos = { name: this.form.name.trim(), sort_order: Number(this.form.sort_order), is_active: this.form.is_active };
    try {
      const slug = this.editando()!;
      if (slug === '') {
        await this.servicio.crear(this.categoria, datos);
        this.aviso.set('Subcategoría creada.');
        this.avisos.exito('Subcategoría creada.');
      } else {
        await this.servicio.editar(this.categoria, slug, datos);
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

  pedirEliminar(slug: string): void {
    this.limpiar();
    this.porEliminar.set(slug);
  }

  async eliminar(slug: string): Promise<void> {
    this.porEliminar.set(null);
    try {
      await this.servicio.eliminar(this.categoria, slug);
      this.aviso.set('Subcategoría eliminada.');
      this.avisos.exito('Subcategoría eliminada.');
      await this.cargar();
    } catch (e) {
      const err = e as ErrorApi;
      if (err.code === 'subcategory_has_products') {
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
