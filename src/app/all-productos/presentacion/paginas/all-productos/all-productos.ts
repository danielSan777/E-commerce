import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TodasCategorias } from '../../componentes/todas-categorias/todas-categorias';
import { MuestraTodosProductos } from '../../componentes/muestra-todos-productos/muestra-todos-productos';

interface Migaja {
  texto: string;
  ruta?: string;   // si tiene ruta, es un enlace; si no, es el texto de la página actual
}

@Component({
  imports: [RouterLink, TodasCategorias, MuestraTodosProductos],
  selector: 'app-all-productos',
  styleUrl: './all-productos.css',
  templateUrl: './all-productos.html',
})

export class AllProductos {

  // ===== TODO LO EDITABLE ESTÁ AQUÍ =====

  // Imagen de fondo del banner
  imagenBanner = 'imagenes/all-productos/portada.png';

  // Texto grande del centro
  titulo = 'Productos';

  // Ruta de navegación debajo del título (Inicio / Productos)
  migas: Migaja[] = [
    { texto: 'Inicio', ruta: '/' },
    { texto: 'Productos' }
  ];

}