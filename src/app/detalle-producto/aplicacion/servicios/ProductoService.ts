import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { ProductoFicha } from '../../dominio/interfaces/producto-ficha';

// Ficha del producto desde Laravel. En el servidor (SSR) se pide antes de entregar la página:
// el HTML ya trae el nombre y el precio.
@Injectable({ providedIn: 'root' })
export class ProductoService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  /** null si el producto no existe o no está activo (404). Cualquier otro error se propaga. */
  producto(slug: string): Observable<ProductoFicha | null> {
    return this.http.get<ProductoFicha>(`${this.api}/products/${encodeURIComponent(slug)}`).pipe(
      catchError((e: HttpErrorResponse) => e.status === 404 ? of(null) : throwError(() => e)),
    );
  }
}
