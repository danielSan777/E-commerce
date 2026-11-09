import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { CategoriasAdminService } from '../../../aplicacion/servicios/CategoriasAdminService';
import { CategoriaAdmin } from '../../../dominio/interfaces/categoria-admin';
import { generarSlug } from '../../../aplicacion/slug';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';

/** Revisa el formulario sin llamar a la API (los límites son los mismos que valida Laravel). */
export function validarCategoria(f: { name: string; headline: string; intro: string; seo_title: string; seo_description: string; sort_order: number | string | null }): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.name.trim()) e['name'] = 'Escribe el nombre de la categoría.';
  else if (f.name.trim().length > 150) e['name'] = 'El nombre no puede pasar de 150 caracteres.';
  if (f.headline.trim().length > 255) e['headline'] = 'La frase no puede pasar de 255 caracteres.';
  if (f.seo_title.trim().length > 255) e['seo_title'] = 'El título para Google no puede pasar de 255 caracteres.';
  if (f.seo_description.trim().length > 320) e['seo_description'] = 'La descripción para Google no puede pasar de 320 caracteres.';
  const orden = Number(f.sort_order);
  if (f.sort_order === null || f.sort_order === '' || !Number.isInteger(orden) || orden < 0 || orden > 65535) e['sort_order'] = 'Escribe la posición como un número entero, desde 0.';
  return e;
}

interface Formulario { name: string; headline: string; intro: string; seo_title: string; seo_description: string; sort_order: number; is_active: boolean }

/** Largo máximo de la descripción para Google (lo mismo que valida Laravel). */
export const MAX_DESCRIPCION_GOOGLE = 320;
/** Largo recomendado del título: Google suele cortarlo alrededor de 60 caracteres. */
export const MAX_TITULO_GOOGLE = 60;

const VACIO: Formulario = { name: '', headline: '', intro: '', seo_title: '', seo_description: '', sort_order: 0, is_active: true };

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

  /** Se pulsó Guardar al menos una vez: recién entonces se marcan los campos vacíos. */
  intento = signal(false);
  error = signal('');
  detalle = signal<string[]>([]);
  aviso = signal('');
  private avisos = inject(AvisosService);
  private destroyRef = inject(DestroyRef);
  /** Respuesta 409: la categoría tiene productos y no se borró. */
  bloqueada = signal<{ slug: string; message: string; products: NonNullable<ErrorApi['products']> } | null>(null);

  constructor() {
    inject(Title).setTitle('Categorías | Panel de Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.servicio.listar().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false))).subscribe({
      next: lista => this.categorias.set(lista),
      error: (e: ErrorApi) => this.error.set(e.message),
    });
  }

  nueva(): void {
    this.limpiar();
    this.slugActual = '';
    this.form = { ...VACIO, sort_order: this.categorias().length + 1 };
    this.intento.set(false);
    this.editando.set('');
  }

  editar(c: CategoriaAdmin): void {
    this.limpiar();
    this.slugActual = c.slug;
    this.form = { name: c.name, headline: c.headline ?? '', intro: c.intro_html ?? '', seo_title: c.seo_title ?? '', seo_description: c.seo_description ?? '', sort_order: c.sort_order, is_active: c.is_active };
    this.intento.set(false);
    this.editando.set(c.slug);
  }

  cancelar(): void {
    this.editando.set(null);
    this.limpiar();
  }

  guardar(evento: Event): void {
    evento.preventDefault();
    if (this.guardando() || this.editando() === null) return;
    this.error.set('');
    this.detalle.set([]);
    this.intento.set(true);
    if (Object.keys(this.errores()).length) return this.avisos.faltanDatos(); // no se llama a la API con datos incompletos
    this.guardando.set(true);
    const base = {
      name: this.form.name.trim(), headline: this.form.headline.trim() || null,
      intro_html: this.form.intro.trim() || null, seo_title: this.form.seo_title.trim() || null, seo_description: this.form.seo_description.trim() || null,
      sort_order: Number(this.form.sort_order), is_active: this.form.is_active };
    const slug = this.editando()!;
    const nuevaCategoria = slug === '';
    // El slug de una categoría nueva lo genera Laravel a partir del nombre.
    const peticion = nuevaCategoria ? this.servicio.crear(base) : this.servicio.editar(slug, base);
    peticion.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.guardando.set(false))).subscribe({
      next: () => {
        const mensaje = nuevaCategoria ? 'Categoría creada.' : 'Cambios guardados.';
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

  /** Errores del formulario ahora mismo; se muestran después de pulsar Guardar. */
  errores(): Record<string, string> {
    return this.intento() ? validarCategoria(this.form) : {};
  }

  /** Cómo se vería en Google si se deja vacío: "Nombre | Jardín de Sele". */
  tituloVistaPrevia(): string {
    return this.form.seo_title.trim() || (this.form.name.trim() ? `${this.form.name.trim()} | Jardín de Sele` : '');
  }

  readonly maxDescripcion = MAX_DESCRIPCION_GOOGLE;
  readonly maxTitulo = MAX_TITULO_GOOGLE;

  /** El identificador que se mostrará: el guardado al editar, o la vista previa del nombre al crear. */
  slugMostrado(): string {
    return this.editando() === '' ? generarSlug(this.form.name) : this.slugActual;
  }

  pedirEliminar(slug: string): void {
    this.limpiar();
    this.porEliminar.set(slug);
  }

  eliminar(slug: string): void {
    this.porEliminar.set(null);
    this.servicio.eliminar(slug).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.aviso.set('Categoría eliminada.');
        this.avisos.exito('Categoría eliminada.');
        this.cargar();
      },
      error: (err: ErrorApi) => {
        if (err.code === 'category_has_products') {
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
