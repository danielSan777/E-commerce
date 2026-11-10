import { Component, inject } from '@angular/core';
import { CargandoService } from './CargandoService';

// Pantalla de carga global: el logo de la tienda en el centro, con un anillo que gira y un latido suave.
@Component({
  selector: 'app-cargando',
  templateUrl: './cargando.html',
  styleUrl: './cargando.css',
})
export class Cargando {
  readonly visible = inject(CargandoService).visible;
}
