import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { aErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { DatosProducto, ProductoAdmin } from '../../dominio/interfaces/producto-admin';

// Productos del panel: todo viene de Laravel (que calcula y valida). El SKU y la dirección (slug) no se pueden cambiar.
@Injectable({ providedIn: 'root' })
export class ProductosAdminService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  private url(sku?: string): string {
    return sku ? `${this.api}/admin/products/${encodeURIComponent(sku)}` : `${this.api}/admin/products`;
  }

  async listar(categoria?: string, texto?: string): Promise<ProductoAdmin[]> {
    let params = new HttpParams();
    if (categoria) params = params.set('category', categoria);
    if (texto?.trim()) params = params.set('q', texto.trim());
    return this.pedir(async () => (await firstValueFrom(this.http.get<{ data: ProductoAdmin[] }>(this.url(), { params }))).data);
  }

  ver(sku: string): Promise<ProductoAdmin> {
    return this.pedir(() => firstValueFrom(this.http.get<ProductoAdmin>(this.url(sku))));
  }

  crear(datos: DatosProducto): Promise<ProductoAdmin> {
    return this.pedir(() => firstValueFrom(this.http.post<ProductoAdmin>(this.url(), datos)));
  }

  /** No se envía el SKU: no se puede cambiar. */
  editar(sku: string, datos: Omit<DatosProducto, 'sku'>): Promise<ProductoAdmin> {
    return this.pedir(() => firstValueFrom(this.http.put<ProductoAdmin>(this.url(sku), datos)));
  }

  eliminar(sku: string): Promise<void> {
    return this.pedir(async () => { await firstValueFrom(this.http.delete(this.url(sku))); });
  }

  private async pedir<T>(accion: () => Promise<T>): Promise<T> {
    try {
      return await accion();
    } catch (e) {
      throw aErrorApi(e);
    }
  }
}
