import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { conErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import {
  AccesorioAdmin, CategoriaAccesorioAdmin, ConfigGuardableAdmin, ConfiguracionDeCategoriaAdmin,
  ConfiguracionDeProductoAdmin, DatosAccesorio, DatosUbicacion, UbicacionAdmin,
} from '../../dominio/interfaces/configurador-admin';

// Configurador del panel: accesorios, ubicaciones y configuración por categoría o por producto. Todo viene de Laravel;
// aquí solo se envía lo que escribe el administrador y se muestran sus respuestas y mensajes.
@Injectable({ providedIn: 'root' })
export class ConfiguradorAdminService {
  private http = inject(HttpClient);
  private api = `${inject(API_URL)}/admin`;

  // ----- categorías de accesorios
  categoriasDeAccesorios(): Observable<CategoriaAccesorioAdmin[]> {
    return this.http.get<{ data: CategoriaAccesorioAdmin[] }>(`${this.api}/accessory-categories`).pipe(map(r => r.data), conErrorApi());
  }
  crearCategoriaDeAccesorio(datos: { name: string; sort_order?: number }): Observable<CategoriaAccesorioAdmin> {
    return this.http.post<CategoriaAccesorioAdmin>(`${this.api}/accessory-categories`, datos).pipe(conErrorApi());
  }
  editarCategoriaDeAccesorio(id: number, datos: { name?: string; sort_order?: number }): Observable<CategoriaAccesorioAdmin> {
    return this.http.put<CategoriaAccesorioAdmin>(`${this.api}/accessory-categories/${id}`, datos).pipe(conErrorApi());
  }
  eliminarCategoriaDeAccesorio(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/accessory-categories/${id}`).pipe(conErrorApi());
  }

  // ----- accesorios
  accesorios(): Observable<AccesorioAdmin[]> {
    return this.http.get<{ data: AccesorioAdmin[] }>(`${this.api}/accessories`).pipe(map(r => r.data), conErrorApi());
  }
  crearAccesorio(datos: DatosAccesorio): Observable<AccesorioAdmin> {
    return this.http.post<AccesorioAdmin>(`${this.api}/accessories`, datos).pipe(conErrorApi());
  }
  editarAccesorio(id: number, datos: Partial<DatosAccesorio>): Observable<AccesorioAdmin> {
    return this.http.put<AccesorioAdmin>(`${this.api}/accessories/${id}`, datos).pipe(conErrorApi());
  }
  /** La imagen reemplaza a la anterior. El texto alternativo es obligatorio. */
  subirImagenDeAccesorio(id: number, archivo: File, alt: string): Observable<AccesorioAdmin> {
    const datos = new FormData();
    datos.append('image', archivo);
    datos.append('alt', alt.trim());
    return this.http.post<AccesorioAdmin>(`${this.api}/accessories/${id}/image`, datos).pipe(conErrorApi());
  }
  /** Si está en alguna configuración Laravel responde 409 `in_use` y no lo borra. */
  eliminarAccesorio(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/accessories/${id}`).pipe(conErrorApi());
  }

  // ----- ubicaciones
  ubicaciones(): Observable<UbicacionAdmin[]> {
    return this.http.get<{ data: UbicacionAdmin[] }>(`${this.api}/locations`).pipe(map(r => r.data), conErrorApi());
  }
  crearUbicacion(datos: DatosUbicacion): Observable<UbicacionAdmin> {
    return this.http.post<UbicacionAdmin>(`${this.api}/locations`, datos).pipe(conErrorApi());
  }
  editarUbicacion(id: number, datos: Partial<DatosUbicacion>): Observable<UbicacionAdmin> {
    return this.http.put<UbicacionAdmin>(`${this.api}/locations/${id}`, datos).pipe(conErrorApi());
  }
  eliminarUbicacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/locations/${id}`).pipe(conErrorApi());
  }

  // ----- imagen para personalizar (una por producto)
  subirImagenBase(sku: string, archivo: File): Observable<ConfiguracionDeProductoAdmin> {
    const datos = new FormData();
    datos.append('image', archivo);
    return this.http.post<ConfiguracionDeProductoAdmin>(`${this.api}/configurator/products/${encodeURIComponent(sku)}/base-image`, datos).pipe(conErrorApi());
  }
  quitarImagenBase(sku: string): Observable<ConfiguracionDeProductoAdmin> {
    return this.http.delete<ConfiguracionDeProductoAdmin>(`${this.api}/configurator/products/${encodeURIComponent(sku)}/base-image`).pipe(conErrorApi());
  }

  // ----- configuración por categoría o por producto
  deCategoria(slug: string): Observable<ConfiguracionDeCategoriaAdmin> {
    return this.http.get<ConfiguracionDeCategoriaAdmin>(`${this.api}/configurator/categories/${encodeURIComponent(slug)}`).pipe(conErrorApi());
  }
  guardarDeCategoria(slug: string, config: ConfigGuardableAdmin): Observable<ConfiguracionDeCategoriaAdmin> {
    return this.http.put<ConfiguracionDeCategoriaAdmin>(`${this.api}/configurator/categories/${encodeURIComponent(slug)}`, config).pipe(conErrorApi());
  }
  deProducto(sku: string): Observable<ConfiguracionDeProductoAdmin> {
    return this.http.get<ConfiguracionDeProductoAdmin>(`${this.api}/configurator/products/${encodeURIComponent(sku)}`).pipe(conErrorApi());
  }
  guardarDeProducto(sku: string, config: ConfigGuardableAdmin): Observable<ConfiguracionDeProductoAdmin> {
    return this.http.put<ConfiguracionDeProductoAdmin>(`${this.api}/configurator/products/${encodeURIComponent(sku)}`, config).pipe(conErrorApi());
  }
  /** «Usa la configuración de su categoría» (false) o «configuración propia» (true; puede partir de una copia de la categoría). */
  cambiarModo(sku: string, propia: boolean, copiarDeLaCategoria = false): Observable<ConfiguracionDeProductoAdmin> {
    return this.http.put<ConfiguracionDeProductoAdmin>(`${this.api}/configurator/products/${encodeURIComponent(sku)}/mode`, {
      uses_own_configurator: propia,
      copy_from_category: copiarDeLaCategoria,
    }).pipe(conErrorApi());
  }
}
