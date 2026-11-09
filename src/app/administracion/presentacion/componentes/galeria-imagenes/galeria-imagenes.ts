import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { FormsModule } from '@angular/forms';
import { ImagenesAdminService } from '../../../aplicacion/servicios/ImagenesAdminService';
import { DuenoDeImagenes, ImagenAdmin } from '../../../dominio/interfaces/imagen-admin';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 8 * 1024 * 1024;

export const ROLES_IMAGEN: { valor: string; texto: string }[] = [
  { valor: 'front', texto: 'Principal (de frente)' },
  { valor: 'angle', texto: 'Otro ángulo' },
  { valor: 'detail', texto: 'Detalle' },
  { valor: 'scale', texto: 'Para ver el tamaño' },
  { valor: 'social', texto: 'Para redes y Google' },
  { valor: 'hero', texto: 'Portada (banner)' },
];

// Galería de imágenes de un producto o una categoría: subir, ver, cambiar descripción/tipo y eliminar.
// La revisión rápida de tipo y peso es solo comodidad: la validación real la hace Laravel.
@Component({
  selector: 'app-galeria-imagenes',
  imports: [FormsModule],
  templateUrl: './galeria-imagenes.html',
  styleUrl: './galeria-imagenes.css',
})
export class GaleriaImagenes implements OnInit {
  private api = inject(ImagenesAdminService);
  private avisos = inject(AvisosService);
  private destroyRef = inject(DestroyRef);

  readonly dueno = input.required<DuenoDeImagenes>();
  readonly clave = input.required<string>();

  readonly roles = ROLES_IMAGEN;
  imagenes = signal<ImagenAdmin[]>([]);
  cargando = signal(true);
  subiendo = signal(false);
  error = signal('');
  aviso = signal('');
  porEliminar = signal<number | null>(null);

  rol = 'front';
  alt = '';

  /** Sin descripción no se puede subir: el botón queda bloqueado y se explica por qué. */
  falta = () => !this.alt.trim();

  /** Imagen que hoy es la principal; mientras exista, el tipo "Principal" queda bloqueado para las demás. */
  principalId = computed(() => this.imagenes().find(i => i.role === 'front')?.id ?? null);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.api.listar(this.dueno(), this.clave()).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false))).subscribe({
      next: lista => {
        this.imagenes.set(lista);
        this.ajustarTipo();
      },
      error: (e: ErrorApi) => this.error.set(e.message),
    });
  }

  elegir(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const archivo = campo.files?.[0];
    campo.value = ''; // permite volver a elegir el mismo archivo
    if (!archivo) return;
    this.error.set('');
    this.aviso.set('');

    if (!this.alt.trim()) return this.error.set('Escribe la descripción de la imagen antes de subirla.');
    if (!TIPOS_PERMITIDOS.includes(archivo.type)) return this.error.set('Elige una imagen JPG, PNG o WebP.');
    if (archivo.size > MAX_BYTES) return this.error.set('La imagen debe pesar menos de 8 MB.');

    this.subiendo.set(true);
    this.api.subir(this.dueno(), this.clave(), archivo, this.rol, this.alt).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.subiendo.set(false))).subscribe({
      next: nueva => {
        this.imagenes.update(l => [...l, nueva]);
        this.alt = '';
        this.aviso.set('Imagen subida.');
        this.avisos.exito('Imagen subida.');
        this.ajustarTipo();
      },
      error: (err: ErrorApi) => this.error.set(Object.values(err.errors ?? {}).flat()[0] ?? err.message),
    });
  }

  guardarDatos(imagen: ImagenAdmin, alt: string, rol: string): void {
    this.error.set('');
    this.aviso.set('');
    if (!alt.trim()) return this.error.set('La descripción de la imagen no puede quedar vacía.');
    this.api.editar(imagen.id, { alt: alt.trim(), role: rol }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: guardada => {
        this.imagenes.update(l => l.map(i => (i.id === guardada.id ? guardada : i)));
        this.aviso.set('Cambios guardados.');
        this.avisos.exito('Cambios guardados.');
        this.ajustarTipo();
      },
      error: (err: ErrorApi) => this.error.set(Object.values(err.errors ?? {}).flat()[0] ?? err.message),
    });
  }

  eliminar(id: number): void {
    this.porEliminar.set(null);
    this.error.set('');
    this.api.eliminar(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.imagenes.update(l => l.filter(i => i.id !== id));
        this.aviso.set('Imagen eliminada.');
        this.avisos.exito('Imagen eliminada.');
        this.ajustarTipo();
      },
      error: (e: ErrorApi) => this.error.set(e.message),
    });
  }

  /** Si ya hay una principal, el tipo elegido para la próxima imagen no puede ser "Principal". Al liberarse, vuelve a ser el predeterminado. */
  private ajustarTipo(): void {
    if (this.principalId() !== null && this.rol === 'front') this.rol = 'angle';
    if (this.principalId() === null && this.rol === 'angle' && this.imagenes().length === 0) this.rol = 'front';
  }

  miniatura(i: ImagenAdmin): string {
    return i.urls['600'] ?? Object.values(i.urls)[0] ?? '';
  }
}
