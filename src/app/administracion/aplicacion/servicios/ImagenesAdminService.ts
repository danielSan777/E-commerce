import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { aErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { DuenoDeImagenes, ImagenAdmin } from '../../dominio/interfaces/imagen-admin';

// Imágenes de productos y categorías. Laravel valida el archivo y genera las versiones WebP; aquí solo se envía y se muestra.
@Injectable({ providedIn: 'root' })
export class ImagenesAdminService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  private url(dueno: DuenoDeImagenes, clave: string): string {
    return `${this.api}/admin/${dueno}/${encodeURIComponent(clave)}/media`;
  }

  listar(dueno: DuenoDeImagenes, clave: string): Promise<ImagenAdmin[]> {
    return this.pedir(async () => (await firstValueFrom(this.http.get<{ data: ImagenAdmin[] }>(this.url(dueno, clave)))).data);
  }

  subir(dueno: DuenoDeImagenes, clave: string, archivo: File, rol: string, alt: string): Promise<ImagenAdmin> {
    const datos = new FormData();
    datos.append('image', archivo);
    datos.append('role', rol);
    datos.append('alt', alt.trim());
    return this.pedir(() => firstValueFrom(this.http.post<ImagenAdmin>(this.url(dueno, clave), datos)));
  }

  editar(id: number, datos: { alt?: string; role?: string }): Promise<ImagenAdmin> {
    return this.pedir(() => firstValueFrom(this.http.put<ImagenAdmin>(`${this.api}/admin/media/${id}`, datos)));
  }

  eliminar(id: number): Promise<void> {
    return this.pedir(async () => { await firstValueFrom(this.http.delete(`${this.api}/admin/media/${id}`)); });
  }

  private async pedir<T>(accion: () => Promise<T>): Promise<T> {
    try {
      return await accion();
    } catch (e) {
      throw aErrorApi(e);
    }
  }
}
