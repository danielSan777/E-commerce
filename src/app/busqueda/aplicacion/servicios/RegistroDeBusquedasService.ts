import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../../../core/configuracion/api';
import { SIN_CARGANDO } from '../../../shared/interceptores/cargandoInterceptor';

// Avisa a Laravel qué se buscó y cuántos resultados hubo, para que el panel liste lo que no se encontró (Pasos 19 y 20).
// Es en segundo plano: no muestra la pantalla de carga y, si falla, la persona no se entera.
@Injectable({ providedIn: 'root' })
export class RegistroDeBusquedasService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  registrar(termino: string, resultados: number): void {
    this.http.post(`${this.api}/search-log`, { term: termino, results_count: resultados }, { context: new HttpContext().set(SIN_CARGANDO, true) })
      .subscribe({ error: () => undefined });
  }
}
