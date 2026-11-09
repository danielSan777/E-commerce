import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { conErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { CategoriaAdmin, DatosCategoria } from '../../dominio/interfaces/categoria-admin';

// Categorías del panel: todo viene de Laravel. Cada método devuelve un Observable; los errores llegan ya normalizados (ErrorApi) con el mensaje en español.
@Injectable({ providedIn: 'root' })
export class CategoriasAdminService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  listar(): Observable<CategoriaAdmin[]> {
    return this.http.get<{ data: CategoriaAdmin[] }>(`${this.api}/admin/categories`).pipe(map(r => r.data), conErrorApi());
  }

  crear(datos: DatosCategoria): Observable<CategoriaAdmin> {
    return this.http.post<CategoriaAdmin>(`${this.api}/admin/categories`, datos).pipe(conErrorApi());
  }

  /** El slug no se envía: no se puede cambiar. */
  editar(slug: string, datos: Omit<DatosCategoria, 'slug'>): Observable<CategoriaAdmin> {
    return this.http.put<CategoriaAdmin>(`${this.api}/admin/categories/${encodeURIComponent(slug)}`, datos).pipe(conErrorApi());
  }

  /** Si la categoría tiene productos Laravel responde 409 `category_has_products` y no borra nada. */
  eliminar(slug: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/admin/categories/${encodeURIComponent(slug)}`).pipe(conErrorApi());
  }
}
