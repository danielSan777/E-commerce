import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { conErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { DuenoDeImagenes, ImagenAdmin } from '../../dominio/interfaces/imagen-admin';

// Imágenes de productos y categorías. Laravel valida el archivo y genera las versiones WebP; aquí solo se envía y se muestra.
@Injectable({ providedIn: 'root' })
export class ImagenesAdminService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  private url(dueno: DuenoDeImagenes, clave: string): string {
    return `${this.api}/admin/${dueno}/${encodeURIComponent(clave)}/media`;
  }

  listar(dueno: DuenoDeImagenes, clave: string): Observable<ImagenAdmin[]> {
    return this.http.get<{ data: ImagenAdmin[] }>(this.url(dueno, clave)).pipe(map(r => r.data), conErrorApi());
  }

  subir(dueno: DuenoDeImagenes, clave: string, archivo: File, rol: string, alt: string): Observable<ImagenAdmin> {
    const datos = new FormData();
    datos.append('image', archivo);
    datos.append('role', rol);
    datos.append('alt', alt.trim());
    return this.http.post<ImagenAdmin>(this.url(dueno, clave), datos).pipe(conErrorApi());
  }

  editar(id: number, datos: { alt?: string; role?: string }): Observable<ImagenAdmin> {
    return this.http.put<ImagenAdmin>(`${this.api}/admin/media/${id}`, datos).pipe(conErrorApi());
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/admin/media/${id}`).pipe(conErrorApi());
  }
}
