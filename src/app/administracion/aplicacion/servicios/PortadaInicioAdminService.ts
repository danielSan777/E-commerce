import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { conErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { PortadaInicio } from '../../../inicio/dominio/interfaces/portada';

export type SeccionPortada = 'inicio' | 'categorias';
export interface TextoEncabezado { title: string | null; subtitle: string | null }

// Portada de la página principal y encabezado de /categorias: lista sin límite de imágenes y videos. Laravel valida el archivo (imagen, o video MP4 H.264 de máx. 1 minuto); aquí solo se envía y se muestra.
@Injectable({ providedIn: 'root' })
export class PortadaInicioAdminService {
  private http = inject(HttpClient);
  private base = `${inject(API_URL)}/admin`;

  /** Cada sección tiene su propia lista: la portada de la página principal o el encabezado de /categorias. */
  private url(seccion: SeccionPortada): string {
    return seccion === 'categorias' ? `${this.base}/categories-page/hero` : `${this.base}/home/hero`;
  }

  /** Título y subtítulo del encabezado de /categorias (null = los textos de siempre). */
  texto(): Observable<TextoEncabezado> {
    return this.http.get<{ data: TextoEncabezado }>(`${this.base}/categories-page/text`).pipe(map(r => r.data), conErrorApi());
  }

  guardarTexto(title: string, subtitle: string): Observable<TextoEncabezado> {
    return this.http.put<{ data: TextoEncabezado }>(`${this.base}/categories-page/text`, { title: title.trim(), subtitle: subtitle.trim() }).pipe(map(r => r.data), conErrorApi());
  }

  lista(seccion: SeccionPortada = 'inicio'): Observable<PortadaInicio[]> {
    return this.http.get<{ data: PortadaInicio[] }>(this.url(seccion)).pipe(map(r => r.data ?? []), conErrorApi());
  }

  subirImagen(archivo: File, alt: string, seccion: SeccionPortada = 'inicio'): Observable<PortadaInicio> {
    const datos = new FormData();
    datos.append('image', archivo);
    datos.append('alt', alt.trim());
    return this.http.post<{ data: PortadaInicio }>(this.url(seccion), datos).pipe(map(r => r.data), conErrorApi());
  }

  subirVideo(video: File, portada: File | null, alt = '', seccion: SeccionPortada = 'inicio'): Observable<PortadaInicio> {
    const datos = new FormData();
    datos.append('video', video);
    if (portada) datos.append('poster', portada);
    if (alt.trim()) datos.append('alt', alt.trim());
    return this.http.post<{ data: PortadaInicio }>(this.url(seccion), datos).pipe(map(r => r.data), conErrorApi());
  }

  quitar(id: string, seccion: SeccionPortada = 'inicio'): Observable<void> {
    return this.http.delete<void>(`${this.url(seccion)}/${encodeURIComponent(id)}`).pipe(conErrorApi());
  }
}
