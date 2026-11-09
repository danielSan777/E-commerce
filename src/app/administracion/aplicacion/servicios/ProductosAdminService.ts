import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { conErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { DatosProducto, PrevisualizacionPrecio, ProductoAdmin } from '../../dominio/interfaces/producto-admin';

// Productos del panel: todo viene de Laravel (que calcula y valida). El código (SKU) lo asigna Laravel y la dirección (slug) sale del nombre.
@Injectable({ providedIn: 'root' })
export class ProductosAdminService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  private url(sku?: string): string {
    return sku ? `${this.api}/admin/products/${encodeURIComponent(sku)}` : `${this.api}/admin/products`;
  }

  listar(categoria?: string, texto?: string): Observable<ProductoAdmin[]> {
    let params = new HttpParams();
    if (categoria) params = params.set('category', categoria);
    if (texto?.trim()) params = params.set('q', texto.trim());
    return this.http.get<{ data: ProductoAdmin[] }>(this.url(), { params }).pipe(map(r => r.data), conErrorApi());
  }

  ver(sku: string): Observable<ProductoAdmin> {
    return this.http.get<ProductoAdmin>(this.url(sku)).pipe(conErrorApi());
  }

  crear(datos: DatosProducto): Observable<ProductoAdmin> {
    return this.http.post<ProductoAdmin>(this.url(), datos).pipe(conErrorApi());
  }

  editar(sku: string, datos: DatosProducto): Observable<ProductoAdmin> {
    return this.http.put<ProductoAdmin>(this.url(sku), datos).pipe(conErrorApi());
  }

  /** Código que recibiría el próximo producto (solo para mostrarlo; el definitivo se asigna al guardar). */
  siguienteSku(): Observable<string> {
    return this.http.get<{ sku: string }>(`${this.url()}/next-sku`).pipe(map(r => r.sku), conErrorApi());
  }

  /** Descuento en dinero y precio final, calculados por Laravel. */
  previsualizarPrecio(baseCents: number, porcentaje: number): Observable<PrevisualizacionPrecio> {
    const params = new HttpParams().set('base_price_cents', baseCents).set('discount_percent', porcentaje);
    return this.http.get<PrevisualizacionPrecio>(`${this.url()}/price-preview`, { params }).pipe(conErrorApi());
  }

  eliminar(sku: string): Observable<void> {
    return this.http.delete<void>(this.url(sku)).pipe(conErrorApi());
  }
}
