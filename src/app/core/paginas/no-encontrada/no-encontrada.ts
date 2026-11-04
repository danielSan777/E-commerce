import { Component, RESPONSE_INIT, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

// Página 404 propia. En el servidor (SSR) responde con estado HTTP 404 de verdad, no solo con el texto.
@Component({
  selector: 'app-no-encontrada',
  imports: [RouterLink],
  templateUrl: './no-encontrada.html',
  styleUrl: './no-encontrada.css',
})
export class NoEncontrada {

  // ===== EDITABLES =====
  readonly RUTA_TIENDA = '/categorias';

  constructor() {
    const respuesta = inject(RESPONSE_INIT, { optional: true });
    if (respuesta) respuesta.status = 404;
  }
}
