import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { conErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { PortadaInicio } from '../../../inicio/dominio/interfaces/portada';

// Portada de la página principal: lista sin límite de imágenes y videos. Laravel valida el archivo (imagen, o video MP4 H.264 de máx. 1 minuto); aquí solo se envía y se muestra.
@Injectable({ providedIn: 'root' })
export class PortadaInicioAdminService {
  private http = inject(HttpClient);
  private url = `${inject(API_URL)}/admin/home/hero`;

  lista(): Observable<PortadaInicio[]> {
    return this.http.get<{ data: PortadaInicio[] }>(this.url).pipe(map(r => r.data ?? []), conErrorApi());
  }

  subirImagen(archivo: File, alt: string): Observable<PortadaInicio> {
    const datos = new FormData();
    datos.append('image', archivo);
    datos.append('alt', alt.trim());
    return this.http.post<{ data: PortadaInicio }>(this.url, datos).pipe(map(r => r.data), conErrorApi());
  }

  subirVideo(video: File, portada: File | null, alt = ''): Observable<PortadaInicio> {
    const datos = new FormData();
    datos.append('video', video);
    if (portada) datos.append('poster', portada);
    if (alt.trim()) datos.append('alt', alt.trim());
    return this.http.post<{ data: PortadaInicio }>(this.url, datos).pipe(map(r => r.data), conErrorApi());
  }

  quitar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${encodeURIComponent(id)}`).pipe(conErrorApi());
  }
}
