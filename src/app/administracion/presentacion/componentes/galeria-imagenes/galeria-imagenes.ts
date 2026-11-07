import { Component, OnInit, inject, input, signal } from '@angular/core';
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

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    try {
      this.imagenes.set(await this.api.listar(this.dueno(), this.clave()));
    } catch (e) {
      this.error.set((e as ErrorApi).message);
    } finally {
      this.cargando.set(false);
    }
  }

  async elegir(evento: Event): Promise<void> {
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
    try {
      const nueva = await this.api.subir(this.dueno(), this.clave(), archivo, this.rol, this.alt);
      this.imagenes.update(l => [...l, nueva]);
      this.alt = '';
      this.aviso.set(this.rol === 'front' ? 'Imagen subida. Es la principal; la anterior pasó a "Otro ángulo".' : 'Imagen subida.');
      if (this.rol === 'front') await this.cargar(); // Laravel deja una sola principal: se vuelve a leer la lista
    } catch (e) {
      const err = e as ErrorApi;
      this.error.set(Object.values(err.errors ?? {}).flat()[0] ?? err.message);
    } finally {
      this.subiendo.set(false);
    }
  }

  async guardarDatos(imagen: ImagenAdmin, alt: string, rol: string): Promise<void> {
    this.error.set('');
    this.aviso.set('');
    if (!alt.trim()) return this.error.set('La descripción de la imagen no puede quedar vacía.');
    try {
      const guardada = await this.api.editar(imagen.id, { alt: alt.trim(), role: rol });
      this.imagenes.update(l => l.map(i => (i.id === guardada.id ? guardada : i)));
      this.aviso.set('Cambios guardados.');
      if (rol === 'front') await this.cargar(); // si esta pasó a principal, la anterior cambió de tipo
    } catch (e) {
      const err = e as ErrorApi;
      this.error.set(Object.values(err.errors ?? {}).flat()[0] ?? err.message);
    }
  }

  async eliminar(id: number): Promise<void> {
    this.porEliminar.set(null);
    this.error.set('');
    try {
      await this.api.eliminar(id);
      this.imagenes.update(l => l.filter(i => i.id !== id));
      this.aviso.set('Imagen eliminada.');
    } catch (e) {
      this.error.set((e as ErrorApi).message);
    }
  }

  miniatura(i: ImagenAdmin): string {
    return i.urls['600'] ?? Object.values(i.urls)[0] ?? '';
  }
}
