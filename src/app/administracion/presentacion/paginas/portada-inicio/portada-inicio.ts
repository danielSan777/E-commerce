import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';
import { PortadaInicio } from '../../../../inicio/dominio/interfaces/portada';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { PortadaInicioAdminService } from '../../../aplicacion/servicios/PortadaInicioAdminService';
import { LIMITES_VIDEO, LectorDeVideo, textoLimite, validarVideo } from '../../../aplicacion/video';

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGEN = 8 * 1024 * 1024;

// Portada de la página principal: imagen o video que reemplaza a la foto de ejemplo. Subir otra reemplaza la actual.
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

  readonly limite = LIMITES_VIDEO.inicio;
  readonly textoLimite = textoLimite(LIMITES_VIDEO.inicio);

  actual = signal<PortadaInicio | null>(null);
  cargando = signal(true);
  subiendo = signal(false);
  error = signal('');
  confirmarQuitar = signal(false);
  tipo = signal<'image' | 'video'>('image');
  portada = signal<File | null>(null);
  alt = '';

  constructor() {
    inject(Title).setTitle('Portada de inicio | Panel de Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  ngOnInit(): void {
    this.api.obtener().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false))).subscribe({
      next: p => this.actual.set(p),
      error: (e: ErrorApi) => this.error.set(e.message),
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
    this.portada.set(archivo);
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
    this.api.subirImagen(archivo, this.alt).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.subiendo.set(false))).subscribe({
      next: p => this.listo(p, 'Portada actualizada.'),
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
        return this.api.subirVideo(archivo, this.portada(), this.alt);
      }),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.subiendo.set(false)),
    ).subscribe({
      next: p => this.listo(p, 'Portada actualizada.'),
      error: (e: ErrorApi | Error) => this.rechazar('errors' in e ? (Object.values(e.errors ?? {}).flat()[0] ?? e.message) : e.message),
    });
  }

  quitar(): void {
    this.confirmarQuitar.set(false);
    this.error.set('');
    this.api.quitar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.actual.set(null);
        this.avisos.exito('Portada quitada. Se vuelve a ver la imagen de siempre.');
      },
      error: (e: ErrorApi) => this.rechazar(e.message),
    });
  }

  private listo(p: PortadaInicio, mensaje: string): void {
    this.actual.set(p);
    this.portada.set(null);
    this.alt = '';
    this.avisos.exito(mensaje);
  }

  private rechazar(motivo: string): void {
    this.error.set(motivo);
    this.avisos.error(motivo);
  }
}
