import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { conErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
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

  listar(categoria: string): Observable<SubcategoriaAdmin[]> {
    return this.http.get<{ data: SubcategoriaAdmin[] }>(this.url(categoria)).pipe(map(r => r.data), conErrorApi());
  }

  crear(categoria: string, datos: DatosSubcategoria): Observable<SubcategoriaAdmin> {
    return this.http.post<SubcategoriaAdmin>(this.url(categoria), datos).pipe(conErrorApi());
  }

  editar(categoria: string, slug: string, datos: DatosSubcategoria): Observable<SubcategoriaAdmin> {
    return this.http.put<SubcategoriaAdmin>(this.url(categoria, slug), datos).pipe(conErrorApi());
  }

  /** Con productos Laravel responde 409 `subcategory_has_products` y no borra nada. */
  eliminar(categoria: string, slug: string): Observable<void> {
    return this.http.delete<void>(this.url(categoria, slug)).pipe(conErrorApi());
  }
}
