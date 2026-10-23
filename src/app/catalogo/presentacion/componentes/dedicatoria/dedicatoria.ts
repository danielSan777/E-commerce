import { Component } from '@angular/core';

interface TarjetaPromo {
  pregunta: string;    // texto pequeño de arriba
  titulo: string;      // texto grande
  descripcion: string;
  boton: string;
  imagen: string;      // ruta de la imagen
  enlace: string;      // a dónde lleva el botón (por ahora '#')
  tamanoTitulo: '2rem';
  tamanoDescripcion: '1rem'
}

@Component({
  imports: [],
  selector: 'app-dedicatoria',
  styleUrl: './dedicatoria.css',
  templateUrl: './dedicatoria.html',
})

export class Dedicatoria {

  // Los dos cuadros (cambie las rutas de las imágenes y los enlaces por los suyos)
  tarjetas: TarjetaPromo[] = [
    {
      pregunta: 'Tarjeta dedicatoria personalizada',
      titulo: '¡Gratis!',
      descripcion: '¡Apresúrate! Oferta de tiempo limitado.',
      boton: 'VER PRODUCTOS',
      imagen: 'imagenes/dedicatoria/dedicatoria.png',
      enlace: '#',
      tamanoTitulo: '2rem',
      tamanoDescripcion: '1rem'
    },
    {
      pregunta: '¿Deseas un regalo más personalizado?',
      titulo: 'Contacto',
      descripcion: 'Sus comentarios y sugerencias serán muy apreciados.',
      boton: 'CONTACTO',
      imagen: 'imagenes/dedicatoria/sicologa.png',
      enlace: '#',
      tamanoTitulo: '2rem',
      tamanoDescripcion: '1rem'
    }
  ];
}
