import { Component, DestroyRef, ElementRef, OnInit, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';
import { ConfiguradorAdminService } from '../../../aplicacion/servicios/ConfiguradorAdminService';
import {
  AccesorioAdmin, CategoriaAccesorioAdmin, ComportamientoAccesorioAdmin, UbicacionAdmin,
} from '../../../dominio/interfaces/configurador-admin';

export const COMPORTAMIENTOS: { valor: ComportamientoAccesorioAdmin; nombre: string }[] = [
  { valor: 'lentes', nombre: 'Lentes (el cliente elige el color)' },
  { valor: 'gafas', nombre: 'Gafas (el cliente elige el color)' },
  { valor: 'marco_foto', nombre: 'Marco con foto (el cliente sube su foto)' },
  { valor: 'marco_frase', nombre: 'Marco con frase (el cliente escribe la frase)' },
];

interface FormAccesorio {
  name: string; accessory_category_id: number; type: 'imagen' | 'texto'; behavior: ComportamientoAccesorioAdmin | ''; default_text: string;
  sort_order: number; is_active: boolean; is_exclusive: boolean; alt: string;
}
interface FormUbicacion { name: string; sort_order: number; allowed: number[]; excluded: number[] }

const ACCESORIO_VACIO: FormAccesorio = { name: '', accessory_category_id: 0, type: 'imagen', behavior: '', default_text: '', sort_order: 0, is_active: true, is_exclusive: false, alt: '' };
const UBICACION_VACIA: FormUbicacion = { name: '', sort_order: 0, allowed: [], excluded: [] };

/**
 * Accesorios, sus categorías y las ubicaciones del configurador. Todo se guarda en la base de datos por Laravel, que valida
 * y responde con sus mensajes; aquí solo se escribe y se muestra.
 */
@Component({
  selector: 'app-admin-accesorios',
  imports: [FormsModule, RouterLink],
  templateUrl: './accesorios.html',
  styleUrl: './accesorios.css',
})
export class AdminAccesorios implements OnInit {
  private servicio = inject(ConfiguradorAdminService);
  private avisos = inject(AvisosService);
  private destroyRef = inject(DestroyRef);

  readonly comportamientos = COMPORTAMIENTOS;

  categorias = signal<CategoriaAccesorioAdmin[]>([]);
  accesorios = signal<AccesorioAdmin[]>([]);
  ubicaciones = signal<UbicacionAdmin[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  error = signal('');
  detalle = signal<string[]>([]);
  /** Lo que se está confirmando para eliminar: `categoria:3`, `accesorio:5`, `ubicacion:2`. */
  porEliminar = signal<string | null>(null);

  // Categorías
  formCategoria = { name: '', sort_order: 0 };
  editandoCategoria = signal<number | null>(null);

  // Accesorios
  formAccesorio: FormAccesorio = { ...ACCESORIO_VACIO };
  editandoAccesorio = signal<number | '' | null>(null);   // null = cerrado; '' = nuevo; número = editando
  archivoImagen: File | null = null;
  /** Lo que se ve en el formulario: la foto recién elegida o, al editar, la que ya tiene el accesorio. */
  vistaPrevia = signal<string | null>(null);
  private campoImagen = viewChild<ElementRef<HTMLInputElement>>('campoImagen');

  // Ubicaciones
  formUbicacion: FormUbicacion = { ...UBICACION_VACIA };
  editandoUbicacion = signal<number | '' | null>(null);

  constructor() {
    inject(Title).setTitle('Accesorios y ubicaciones | Panel de Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    forkJoin({ c: this.servicio.categoriasDeAccesorios(), a: this.servicio.accesorios(), u: this.servicio.ubicaciones() })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: ({ c, a, u }) => {
          this.categorias.set(c);
          this.accesorios.set(a);
          this.ubicaciones.set(u);
          this.cargando.set(false);
        },
        error: e => this.fallo(e),
      });
  }

  private fallo(e: unknown): void {
    const api = e as ErrorApi;
    this.cargando.set(false);
    this.guardando.set(false);
    this.error.set(api?.message ?? 'No se pudo completar la acción. Inténtalo de nuevo.');
    this.detalle.set(api?.errors ? Object.values(api.errors).flat() : []);
  }

  private limpiar(): void {
    this.error.set('');
    this.detalle.set([]);
    this.porEliminar.set(null);
  }

  /** Ejecuta una petición de guardado: avisa, recarga las listas y llama a `luego`. */
  private ejecutar(peticion: Observable<unknown>, mensaje: string, luego: () => void): void {
    this.guardando.set(true);
    this.limpiar();
    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.guardando.set(false);
        this.avisos.exito(mensaje);
        luego();
        this.cargar();
      },
      error: e => this.fallo(e),
    });
  }

  confirmarEliminar(clave: string): void { this.porEliminar.set(clave); }
  cancelarEliminar(): void { this.porEliminar.set(null); }

  // ----- Categorías de accesorios

  guardarCategoria(): void {
    const id = this.editandoCategoria();
    const datos = { name: this.formCategoria.name.trim(), sort_order: Number(this.formCategoria.sort_order) || 0 };
    const peticion = id === null ? this.servicio.crearCategoriaDeAccesorio(datos) : this.servicio.editarCategoriaDeAccesorio(id, datos);
    this.ejecutar(peticion, id === null ? 'Categoría creada.' : 'Categoría guardada.', () => this.cancelarCategoria());
  }

  editarCategoria(c: CategoriaAccesorioAdmin): void {
    this.editandoCategoria.set(c.id);
    this.formCategoria = { name: c.name, sort_order: c.sort_order };
  }

  cancelarCategoria(): void {
    this.editandoCategoria.set(null);
    this.formCategoria = { name: '', sort_order: 0 };
  }

  eliminarCategoria(id: number): void {
    this.ejecutar(this.servicio.eliminarCategoriaDeAccesorio(id), 'Categoría eliminada.', () => undefined);
  }

  // ----- Accesorios

  nuevoAccesorio(): void {
    this.formAccesorio = { ...ACCESORIO_VACIO, accessory_category_id: this.categorias()[0]?.id ?? 0, sort_order: this.accesorios().length + 1 };
    this.vaciarArchivo();
    this.ponerVistaPrevia(null);
    this.limpiar();
    this.editandoAccesorio.set('');
  }

  editarAccesorio(a: AccesorioAdmin): void {
    this.formAccesorio = {
      name: a.name, accessory_category_id: a.category_id, type: a.type, behavior: a.behavior ?? '', default_text: a.text ?? '',
      sort_order: a.sort_order, is_active: a.is_active, is_exclusive: a.is_exclusive, alt: a.alt ?? '',
    };
    this.vaciarArchivo();
    this.ponerVistaPrevia(a.image ?? a.thumb ?? null);
    this.limpiar();
    this.editandoAccesorio.set(a.id);
  }

  cancelarAccesorio(): void {
    this.editandoAccesorio.set(null);
    this.vaciarArchivo();
    this.ponerVistaPrevia(null);
  }

  /** Olvida el archivo elegido, también en el campo de la pantalla: así no queda un nombre viejo que parece subirse y no se sube. */
  private vaciarArchivo(): void {
    this.archivoImagen = null;
    const campo = this.campoImagen()?.nativeElement;
    if (campo) campo.value = '';
  }

  elegirImagen(evento: Event): void {
    this.archivoImagen = (evento.target as HTMLInputElement).files?.[0] ?? null;
    this.ponerVistaPrevia(this.archivoImagen ? URL.createObjectURL(this.archivoImagen) : null);
  }

  private ponerVistaPrevia(url: string | null): void {
    const anterior = this.vistaPrevia();
    if (anterior?.startsWith('blob:')) URL.revokeObjectURL(anterior);
    this.vistaPrevia.set(url);
  }

  guardarAccesorio(): void {
    const f = this.formAccesorio;
    const id = this.editandoAccesorio();
    const datos = {
      name: f.name.trim(),
      accessory_category_id: Number(f.accessory_category_id),
      type: f.type,
      behavior: f.behavior || null,
      default_text: f.type === 'texto' ? f.default_text.trim() : null,
      sort_order: Number(f.sort_order) || 0,
      is_active: f.is_active,
      is_exclusive: f.is_exclusive,
    };

    if (f.type === 'imagen' && this.archivoImagen && !f.alt.trim()) {
      this.error.set('Escribe el texto alternativo de la imagen (lo que se ve en ella).');
      return;
    }

    const guardado = id === '' || id === null ? this.servicio.crearAccesorio(datos) : this.servicio.editarAccesorio(id, datos);
    this.guardando.set(true);
    this.limpiar();
    guardado.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: a => {
        const archivo = f.type === 'imagen' ? this.archivoImagen : null;
        if (!archivo) { this.terminarAccesorio(id === '' ? 'Accesorio creado.' : 'Accesorio guardado.'); return; }
        // El accesorio ya existe; falta subir su imagen
        this.servicio.subirImagenDeAccesorio(a.id, archivo, f.alt).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => this.terminarAccesorio('Accesorio guardado con su imagen.'),
          error: e => { this.editandoAccesorio.set(a.id); this.fallo(e); this.cargar(); },
        });
      },
      error: e => this.fallo(e),
    });
  }

  private terminarAccesorio(mensaje: string): void {
    this.guardando.set(false);
    this.avisos.exito(mensaje);
    this.cancelarAccesorio();
    this.cargar();
  }

  eliminarAccesorio(id: number): void {
    this.ejecutar(this.servicio.eliminarAccesorio(id), 'Accesorio eliminado.', () => undefined);
  }

  // ----- Ubicaciones

  nuevaUbicacion(): void {
    this.formUbicacion = { ...UBICACION_VACIA, sort_order: this.ubicaciones().length + 1, allowed: [], excluded: [] };
    this.limpiar();
    this.editandoUbicacion.set('');
  }

  editarUbicacion(u: UbicacionAdmin): void {
    this.formUbicacion = { name: u.name, sort_order: u.sort_order, allowed: [...u.allowed_category_ids], excluded: [...u.excluded_category_ids] };
    this.limpiar();
    this.editandoUbicacion.set(u.id);
  }

  cancelarUbicacion(): void { this.editandoUbicacion.set(null); }

  /** Marca o desmarca una categoría como permitida o excluida (no puede estar en las dos). */
  alternarRegla(lista: 'allowed' | 'excluded', categoria: number, marcada: boolean): void {
    const otra = lista === 'allowed' ? 'excluded' : 'allowed';
    const f = this.formUbicacion;
    f[lista] = marcada ? [...new Set([...f[lista], categoria])] : f[lista].filter(c => c !== categoria);
    if (marcada) f[otra] = f[otra].filter(c => c !== categoria);
  }

  guardarUbicacion(): void {
    const f = this.formUbicacion;
    const id = this.editandoUbicacion();
    const datos = { name: f.name.trim(), sort_order: Number(f.sort_order) || 0, allowed_category_ids: f.allowed, excluded_category_ids: f.excluded };
    const peticion = id === '' || id === null ? this.servicio.crearUbicacion(datos) : this.servicio.editarUbicacion(id, datos);
    this.ejecutar(peticion, id === '' ? 'Ubicación creada.' : 'Ubicación guardada.', () => this.cancelarUbicacion());
  }

  eliminarUbicacion(id: number): void {
    this.ejecutar(this.servicio.eliminarUbicacion(id), 'Ubicación eliminada.', () => undefined);
  }

  /** Resumen de las reglas de categoría de una ubicación, para la lista. */
  reglas(u: UbicacionAdmin): string {
    if (u.allowed_categories.length) return `Solo: ${u.allowed_categories.join(', ')}`;
    if (u.excluded_categories.length) return `Todas menos: ${u.excluded_categories.join(', ')}`;
    return 'Todas las categorías';
  }

  nombreComportamiento(b: ComportamientoAccesorioAdmin | null): string {
    return COMPORTAMIENTOS.find(c => c.valor === b)?.nombre.split(' (')[0] ?? '';
  }
}
