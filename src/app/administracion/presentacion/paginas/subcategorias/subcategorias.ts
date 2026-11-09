import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
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
  private destroyRef = inject(DestroyRef);
  bloqueada = signal<{ slug: string; message: string; products: NonNullable<ErrorApi['products']> } | null>(null);

  constructor() {
    inject(Title).setTitle('Subcategorías | Panel de Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.servicio.listar(this.categoria).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false))).subscribe({
      next: lista => this.lista.set(lista),
      error: (e: ErrorApi) => this.error.set(e.message),
    });
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

  guardar(evento: Event): void {
    evento.preventDefault();
    if (this.guardando() || this.editando() === null) return;
    this.error.set('');
    this.detalle.set([]);
    this.guardando.set(true);
    const datos = { name: this.form.name.trim(), sort_order: Number(this.form.sort_order), is_active: this.form.is_active };
    const slug = this.editando()!;
    const nueva = slug === '';
    const peticion = nueva ? this.servicio.crear(this.categoria, datos) : this.servicio.editar(this.categoria, slug, datos);
    peticion.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.guardando.set(false))).subscribe({
      next: () => {
        const mensaje = nueva ? 'Subcategoría creada.' : 'Cambios guardados.';
        this.aviso.set(mensaje);
        this.avisos.exito(mensaje);
        this.editando.set(null);
        this.cargar();
      },
      error: (err: ErrorApi) => {
        this.error.set(err.message);
        this.detalle.set(Object.values(err.errors ?? {}).flat());
      },
    });
  }

  pedirEliminar(slug: string): void {
    this.limpiar();
    this.porEliminar.set(slug);
  }

  eliminar(slug: string): void {
    this.porEliminar.set(null);
    this.servicio.eliminar(this.categoria, slug).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.aviso.set('Subcategoría eliminada.');
        this.avisos.exito('Subcategoría eliminada.');
        this.cargar();
      },
      error: (err: ErrorApi) => {
        if (err.code === 'subcategory_has_products') {
          this.bloqueada.set({ slug, message: err.message, products: err.products ?? [] });
        } else {
          this.error.set(err.message);
        }
      },
    });
  }

  private limpiar(): void {
    this.error.set('');
    this.detalle.set([]);
    this.aviso.set('');
    this.bloqueada.set(null);
    this.porEliminar.set(null);
  }
}
