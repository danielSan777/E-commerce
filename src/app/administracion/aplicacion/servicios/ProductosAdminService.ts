import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { conErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { DatosProducto, PaginaProductos, PrevisualizacionPrecio, ProductoAdmin } from '../../dominio/interfaces/producto-admin';

// Productos del panel: todo viene de Laravel (que calcula y valida). El código (SKU) lo asigna Laravel y la dirección (slug) sale del nombre.
@Injectable({ providedIn: 'root' })
export class ProductosAdminService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  private url(sku?: string): string {
    return sku ? `${this.api}/admin/products/${encodeURIComponent(sku)}` : `${this.api}/admin/products`;
  }

  listar(categoria?: string, texto?: string, tipo?: 'personalizable' | 'complemento'): Observable<ProductoAdmin[]> {
    let params = new HttpParams();
    if (tipo) params = params.set('type', tipo);
    if (categoria) params = params.set('category', categoria);
    if (texto?.trim()) params = params.set('q', texto.trim());
    return this.http.get<{ data: ProductoAdmin[] }>(this.url(), { params }).pipe(map(r => r.data), conErrorApi());
  }

  /** Una parte del listado (para no traer cientos de productos de una vez). Laravel responde cuántos hay en total. */
  listarPagina(filtros: { categoria?: string; texto?: string; tipo?: 'personalizable' | 'complemento'; pagina: number; porPagina: number }): Observable<PaginaProductos> {
    let params = new HttpParams().set('page', filtros.pagina).set('per_page', filtros.porPagina);
    if (filtros.tipo) params = params.set('type', filtros.tipo);
    if (filtros.categoria) params = params.set('category', filtros.categoria);
    if (filtros.texto?.trim()) params = params.set('q', filtros.texto.trim());
    return this.http.get<PaginaProductos>(this.url(), { params }).pipe(conErrorApi());
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

  /** Agotar (`false`) o volver a vender (`true`) un producto: Laravel acepta el cambio de un solo campo. */
  cambiarDisponibilidad(sku: string, disponible: boolean): Observable<ProductoAdmin> {
    return this.http.put<ProductoAdmin>(this.url(sku), { is_available: disponible }).pipe(conErrorApi());
  }

  /** Imagen para personalizar del producto (reemplaza la anterior). Es obligatoria en los personalizables. */
  subirImagenParaPersonalizar(sku: string, archivo: File): Observable<{ personalization_image: string }> {
    const datos = new FormData();
    datos.append('image', archivo);
    return this.http.post<{ personalization_image: string }>(`${this.url(sku)}/personalization-image`, datos).pipe(conErrorApi());
  }

  /** Foto única y obligatoria de un complemento (reemplaza la anterior). Sin galería ni video. */
  subirFotoDeComplemento(sku: string, archivo: File): Observable<unknown> {
    const datos = new FormData();
    datos.append('image', archivo);
    return this.http.post(`${this.url(sku)}/complement-photo`, datos).pipe(conErrorApi());
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
