import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { aErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { CategoriaAdmin, DatosCategoria } from '../../dominio/interfaces/categoria-admin';

// Categorías del panel: todo viene de Laravel. Los errores llegan ya normalizados (ErrorApi) con el mensaje en español.
@Injectable({ providedIn: 'root' })
export class CategoriasAdminService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  async listar(): Promise<CategoriaAdmin[]> {
    return this.pedir(async () => (await firstValueFrom(this.http.get<{ data: CategoriaAdmin[] }>(`${this.api}/admin/categories`))).data);
  }

  crear(datos: DatosCategoria): Promise<CategoriaAdmin> {
    return this.pedir(() => firstValueFrom(this.http.post<CategoriaAdmin>(`${this.api}/admin/categories`, datos)));
  }

  /** El slug no se envía: no se puede cambiar. */
  editar(slug: string, datos: Omit<DatosCategoria, 'slug'>): Promise<CategoriaAdmin> {
    return this.pedir(() => firstValueFrom(this.http.put<CategoriaAdmin>(`${this.api}/admin/categories/${encodeURIComponent(slug)}`, datos)));
  }

  /** Si la categoría tiene productos Laravel responde 409 `category_has_products` y no borra nada. */
  eliminar(slug: string): Promise<void> {
    return this.pedir(async () => { await firstValueFrom(this.http.delete(`${this.api}/admin/categories/${encodeURIComponent(slug)}`)); });
  }

  private async pedir<T>(accion: () => Promise<T>): Promise<T> {
    try {
      return await accion();
    } catch (e) {
      throw aErrorApi(e);
    }
  }
}
