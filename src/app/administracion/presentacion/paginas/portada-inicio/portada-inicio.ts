import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';
import { PortadaInicio } from '../../../../inicio/dominio/interfaces/portada';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { PortadaInicioAdminService, SeccionPortada } from '../../../aplicacion/servicios/PortadaInicioAdminService';
import { LIMITES_VIDEO, LectorDeVideo, crearVista, liberarVista, textoLimite, validarVideo } from '../../../aplicacion/video';

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGEN = 8 * 1024 * 1024;

// Portada de la página principal: lista SIN límite de imágenes y videos que reemplaza a la foto de ejemplo; la tienda los muestra uno tras otro.
// La revisión de tipo, peso y duración en el navegador es solo comodidad: la validación real la hace Laravel.
@Component({
  selector: 'app-admin-portada-inicio',
  imports: [RouterLink, FormsModule],
  templateUrl: './portada-inicio.html',
  styleUrl: '../subcategorias/subcategorias.css',
})
export class AdminPortadaInicio implements OnInit {
  private api = inject(PortadaInicioAdminService);
  private lector = inject(LectorDeVideo);
  private avisos = inject(AvisosService);
  private destroyRef = inject(DestroyRef);
  /** 'inicio' (página principal) o 'categorias' (encabezado de /categorias): la ruta lo indica. */
  readonly seccion: SeccionPortada = inject(ActivatedRoute).snapshot.data['seccion'] === 'categorias' ? 'categorias' : 'inicio';
  readonly nombre = this.seccion === 'categorias' ? 'Encabezado de la página de categorías' : 'Portada de la página principal';
  titulo = '';
  subtitulo = '';
  guardandoTexto = signal(false);

  readonly limite = LIMITES_VIDEO.inicio;
  readonly textoLimite = textoLimite(LIMITES_VIDEO.inicio);

  lista = signal<PortadaInicio[]>([]);
  cargando = signal(true);
  subiendo = signal(false);
  error = signal('');
  /** id de la portada que está pidiendo confirmación para quitarse. */
  confirmarQuitar = signal('');
  tipo = signal<'image' | 'video'>('image');
  portada = signal<File | null>(null);
  /** Dirección temporal para ver la portada elegida antes de subir el video. */
  portadaVista = signal('');
  alt = '';

  constructor() {
    inject(Title).setTitle(`${this.nombre} | Panel de Jardín de Sele`);
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
    this.destroyRef.onDestroy(() => liberarVista(this.portadaVista()));
  }

  ngOnInit(): void {
    this.api.lista(this.seccion).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false))).subscribe({
      next: l => this.lista.set(l),
      error: (e: ErrorApi) => this.error.set(e.message),
    });
    if (this.seccion === 'categorias') {
      this.api.texto().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: t => { this.titulo = t.title ?? ''; this.subtitulo = t.subtitle ?? ''; },
        error: (e: ErrorApi) => this.error.set(e.message),
      });
    }
  }

  guardarTexto(): void {
    this.error.set('');
    this.guardandoTexto.set(true);
    this.api.guardarTexto(this.titulo, this.subtitulo).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.guardandoTexto.set(false))).subscribe({
      next: t => { this.titulo = t.title ?? ''; this.subtitulo = t.subtitle ?? ''; this.avisos.exito('Textos guardados.'); },
      error: (e: ErrorApi) => this.rechazar(Object.values(e.errors ?? {}).flat()[0] ?? e.message),
    });
  }

  imagenActual(p: Extract<PortadaInicio, { type: 'image' }>): string {
    return p.srcset['1080'] ?? Object.values(p.srcset)[0] ?? '';
  }

  elegirPortada(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const archivo = campo.files?.[0] ?? null;
    campo.value = '';
    if (archivo && !TIPOS_IMAGEN.includes(archivo.type)) return this.rechazar('La portada del video debe ser una imagen JPG, PNG o WebP.');
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

  elegirImagen(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const archivo = campo.files?.[0];
    campo.value = '';
    if (!archivo) return;
    this.error.set('');
    const motivo = !this.alt.trim() ? 'Escribe la descripción de la imagen antes de subirla.'
      : !TIPOS_IMAGEN.includes(archivo.type) ? 'Elige una imagen JPG, PNG o WebP.'
      : archivo.size > MAX_IMAGEN ? 'La imagen debe pesar menos de 8 MB.' : '';
    if (motivo) return this.rechazar(motivo);

    this.subiendo.set(true);
    this.api.subirImagen(archivo, this.alt, this.seccion).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.subiendo.set(false))).subscribe({
      next: p => this.listo(p, 'Imagen agregada a la portada.'),
      error: (e: ErrorApi) => this.rechazar(Object.values(e.errors ?? {}).flat()[0] ?? e.message),
    });
  }

  elegirVideo(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const archivo = campo.files?.[0];
    campo.value = '';
    if (!archivo) return;
    this.error.set('');
    const previo = validarVideo(archivo, null, this.limite);
    if (previo) return this.rechazar(previo);

    this.subiendo.set(true);
    this.lector.duracion(archivo).pipe(
      switchMap(duracion => {
        const motivo = validarVideo(archivo, duracion, this.limite);
        if (motivo) throw new Error(motivo);
        return this.api.subirVideo(archivo, this.portada(), this.alt, this.seccion);
      }),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.subiendo.set(false)),
    ).subscribe({
      next: p => this.listo(p, 'Video agregado a la portada.'),
      error: (e: ErrorApi | Error) => this.rechazar('errors' in e ? (Object.values(e.errors ?? {}).flat()[0] ?? e.message) : e.message),
    });
  }

  quitar(id: string): void {
    this.confirmarQuitar.set('');
    this.error.set('');
    this.api.quitar(id, this.seccion).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.lista.update(l => l.filter(p => p.id !== id));
        this.avisos.exito(this.lista().length ? 'Portada quitada.' : this.seccion === 'categorias' ? 'Quitado. Se vuelven a ver las fotos de las categorías.' : 'Portada quitada. Se vuelve a ver la imagen de siempre.');
      },
      error: (e: ErrorApi) => this.rechazar(e.message),
    });
  }

  private listo(p: PortadaInicio, mensaje: string): void {
    this.lista.update(l => [...l, p]);
    this.fijarPortada(null);
    this.alt = '';
    this.avisos.exito(mensaje);
  }

  private rechazar(motivo: string): void {
    this.error.set(motivo);
    this.avisos.error(motivo);
  }
}
