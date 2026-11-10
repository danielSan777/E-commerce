import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, switchMap } from 'rxjs';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { FormsModule } from '@angular/forms';
import { ImagenesAdminService } from '../../../aplicacion/servicios/ImagenesAdminService';
import { DuenoDeImagenes, ImagenAdmin } from '../../../dominio/interfaces/imagen-admin';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';
import { LIMITES_VIDEO, LectorDeVideo, LimiteVideo, crearVista, liberarVista, textoLimite, validarVideo } from '../../../aplicacion/video';

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

// Galería de imágenes de un producto o una categoría: subir, ver, cambiar descripción/tipo y eliminar. También sube su video
// (máx. 1 minuto).
// La revisión rápida de tipo y peso es solo comodidad: la validación real la hace Laravel.
@Component({
  selector: 'app-galeria-imagenes',
  imports: [FormsModule],
  templateUrl: './galeria-imagenes.html',
  styleUrl: './galeria-imagenes.css',
})
export class GaleriaImagenes implements OnInit {
  private api = inject(ImagenesAdminService);
  private lector = inject(LectorDeVideo);
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
  /** Portada opcional del video (imagen del primer cuadro). Sin ella, la tienda muestra el primer cuadro del propio video. */
  portada = signal<File | null>(null);
  /** Dirección temporal para ver la portada elegida antes de subir el video. */
  portadaVista = signal('');
  subiendoVideo = signal(false);

  constructor() {
    this.destroyRef.onDestroy(() => liberarVista(this.portadaVista()));
  }

  /** Los videos solo existen en productos y categorías, y se pueden subir sin límite de cantidad. */
  readonly puedeVideo = computed(() => this.dueno() === 'products' || this.dueno() === 'categories');
  readonly limiteVideo = computed<LimiteVideo>(() => (this.dueno() === 'products' ? LIMITES_VIDEO.products : LIMITES_VIDEO.categories));
  readonly textoLimiteVideo = computed(() => textoLimite(this.limiteVideo()));
  readonly hayVideo = computed(() => this.imagenes().some(i => i.type === 'video'));

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

    const rechazo = !this.alt.trim() ? 'Escribe la descripción de la imagen antes de subirla.'
      : !TIPOS_PERMITIDOS.includes(archivo.type) ? 'Elige una imagen JPG, PNG o WebP.'
      : archivo.size > MAX_BYTES ? 'La imagen debe pesar menos de 8 MB.' : '';
    if (rechazo) {
      this.error.set(rechazo);
      return this.avisos.error(rechazo);
    }

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
    if (!alt.trim()) {
      this.error.set('La descripción de la imagen no puede quedar vacía.');
      return this.avisos.error('La descripción de la imagen no puede quedar vacía.');
    }
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

  elegirPortada(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const archivo = campo.files?.[0] ?? null;
    campo.value = '';
    if (archivo && !TIPOS_PERMITIDOS.includes(archivo.type)) {
      this.error.set('La portada del video debe ser una imagen JPG, PNG o WebP.');
      return this.avisos.error('La portada del video debe ser una imagen JPG, PNG o WebP.');
    }
    this.error.set('');
    this.fijarPortada(archivo);
  }

  quitarPortada(): void {
    this.fijarPortada(null);
  }

  private fijarPortada(archivo: File | null): void {
    liberarVista(this.portadaVista());
    this.portada.set(archivo);
    this.portadaVista.set(archivo ? crearVista(archivo) : '');
  }

  /** Revisa tipo, peso y duración en el navegador y, si todo está bien, lo sube. La validación real la hace Laravel. */
  elegirVideo(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const archivo = campo.files?.[0];
    campo.value = '';
    if (!archivo) return;
    this.error.set('');
    this.aviso.set('');
    const limite = this.limiteVideo();

    // El tipo y el peso se revisan al instante; la duración requiere leer el video
    const previo = validarVideo(archivo, null, limite);
    if (previo) return this.rechazarVideo(previo);

    this.subiendoVideo.set(true);
    this.lector.duracion(archivo).pipe(
      switchMap(duracion => {
        const motivo = validarVideo(archivo, duracion, limite);
        if (motivo) throw new Error(motivo);
        return this.api.subirVideo(this.dueno(), this.clave(), archivo, this.portada());
      }),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.subiendoVideo.set(false)),
    ).subscribe({
      next: nuevo => {
        this.imagenes.update(l => [...l, nuevo]);
        this.fijarPortada(null);
        this.aviso.set('Video subido.');
        this.avisos.exito('Video subido.');
      },
      error: (err: ErrorApi | Error) => this.rechazarVideo('errors' in err ? (Object.values(err.errors ?? {}).flat()[0] ?? err.message) : err.message),
    });
  }

  private rechazarVideo(motivo: string): void {
    this.error.set(motivo);
    this.avisos.error(motivo);
  }

  miniatura(i: ImagenAdmin): string {
    return i.urls['600'] ?? i.urls['poster'] ?? Object.values(i.urls)[0] ?? '';
  }
}
