import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { aErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { DatosProducto, PrevisualizacionPrecio, ProductoAdmin } from '../../dominio/interfaces/producto-admin';

// Productos del panel: todo viene de Laravel (que calcula y valida). El código (SKU) lo asigna Laravel y la dirección (slug) sale del nombre.
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

  editar(sku: string, datos: DatosProducto): Promise<ProductoAdmin> {
    return this.pedir(() => firstValueFrom(this.http.put<ProductoAdmin>(this.url(sku), datos)));
  }

  /** Código que recibiría el próximo producto (solo para mostrarlo; el definitivo se asigna al guardar). */
  async siguienteSku(): Promise<string> {
    return this.pedir(async () => (await firstValueFrom(this.http.get<{ sku: string }>(`${this.url()}/next-sku`))).sku);
  }

  /** Descuento en dinero y precio final, calculados por Laravel. */
  previsualizarPrecio(baseCents: number, porcentaje: number): Promise<PrevisualizacionPrecio> {
    const params = new HttpParams().set('base_price_cents', baseCents).set('discount_percent', porcentaje);
    return this.pedir(() => firstValueFrom(this.http.get<PrevisualizacionPrecio>(`${this.url()}/price-preview`, { params })));
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
