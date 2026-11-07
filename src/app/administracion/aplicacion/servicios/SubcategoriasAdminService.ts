import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { aErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { DatosSubcategoria, SubcategoriaAdmin } from '../../dominio/interfaces/categoria-admin';

// Subcategorías del panel: todo viene de Laravel. El slug no se envía: Laravel lo genera del nombre.
@Injectable({ providedIn: 'root' })
export class SubcategoriasAdminService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  private url(categoria: string, slug?: string): string {
    const base = `${this.api}/admin/categories/${encodeURIComponent(categoria)}/subcategories`;
    return slug ? `${base}/${encodeURIComponent(slug)}` : base;
  }

  async listar(categoria: string): Promise<SubcategoriaAdmin[]> {
    return this.pedir(async () => (await firstValueFrom(this.http.get<{ data: SubcategoriaAdmin[] }>(this.url(categoria)))).data);
  }

  crear(categoria: string, datos: DatosSubcategoria): Promise<SubcategoriaAdmin> {
    return this.pedir(() => firstValueFrom(this.http.post<SubcategoriaAdmin>(this.url(categoria), datos)));
  }

  editar(categoria: string, slug: string, datos: DatosSubcategoria): Promise<SubcategoriaAdmin> {
    return this.pedir(() => firstValueFrom(this.http.put<SubcategoriaAdmin>(this.url(categoria, slug), datos)));
  }

  /** Con productos Laravel responde 409 `subcategory_has_products` y no borra nada. */
  eliminar(categoria: string, slug: string): Promise<void> {
    return this.pedir(async () => { await firstValueFrom(this.http.delete(this.url(categoria, slug))); });
  }

  private async pedir<T>(accion: () => Promise<T>): Promise<T> {
    try {
      return await accion();
    } catch (e) {
      throw aErrorApi(e);
    }
  }
}
