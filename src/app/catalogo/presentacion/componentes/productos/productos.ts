import { Component, computed } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-productos',
  styleUrl: './productos.css',
  templateUrl: './productos.html',
})


export class Productos {

  // Productos (cambie las rutas, nombres y precios por los suyos). Solo se muestran los primeros 8.
  productos: Producto[] = [
    { id: 1, nombre: 'Baby Garfield', imagen: 'imagenes/colecciones/personajes/baby.png', precio: 22 },
    { id: 2, nombre: 'Bellota Chicas super poderosas', imagen: 'imagenes/colecciones/personajes/bellota.png', precio: 20 },
    { id: 3, nombre: 'Bombón Chicas super poderosas', imagen: 'imagenes/colecciones/personajes/bonbom.png', precio: 20 },
    { id: 4, nombre: 'Burbuja Chicas super poderosas', imagen: 'imagenes/colecciones/personajes/burbuja.png', precio: 20, precioAnterior: 220, descuento: 10 },
    { id: 5, nombre: 'Homero Simpson', imagen: 'imagenes/colecciones/personajes/homero.png', precio: 22, precioAnterior: 220, descuento: 5 },
    { id: 6, nombre: 'Lucas con pantalón, personalizado', imagen: 'imagenes/colecciones/personajes/lucas.png', precio: 22, precioAnterior: 220 },
    { id: 7, nombre: 'Pato Lucas clásico', imagen: 'imagenes/colecciones/personajes/pato.png', precio: 20, precioAnterior: 240, descuento: 5 },
    { id: 8, nombre: 'Pikachu', imagen: 'imagenes/colecciones/personajes/picachu.png', precio: 20, precioAnterior: 220, descuento: 5 },
  ];


  // Máximo 8 productos en pantalla
  productosVisibles = computed(() => this.productos.slice(0, 8));

  // Formato del precio: S/. 299.00 PEN
  formatoPrecio(valor: number): string {
    return `$/. ${valor.toFixed(2)} `;
  }





}
