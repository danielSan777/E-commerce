import { Component, computed, signal } from '@angular/core';

interface Slide {
  id: number;
  pregunta: string;
  titulo: string;
  descripcion: string;
  boton: string;
  imagen: string;
}

@Component({
  imports: [],
  selector: 'app-catalogo',
  styleUrl: './catalogo.css',
  templateUrl: './catalogo.html',
})

export class Catalogo {

  // Cada diapositiva: su texto, su botón y su imagen (cambie las rutas de las imágenes por las suyas)
  slides: Slide[] = [
    {
      id: 1,
      pregunta: 'Los regalos mas bonitos del Ecuador',
      titulo: 'Bienvenidos a El Jardín de Sele',
      descripcion: 'regalos llenos de vida que adornaran tu espacio o el de esa persona especial',
      boton: 'Ver Productos',
      imagen: 'imagenes/doctor3D.png',
    },
    {
      id: 2,
      pregunta: '¿No sabes qué regalar?',
      titulo: 'Crea tu propia maceta',
      descripcion: 'Elige los accesorios y personaliza tu maceta con el nombre de esa persona especial',
      boton: 'Personalizar',
      imagen: 'imagenes/licenciada.png',
    },
    {
      id: 3,
      pregunta: 'compra desde la comodidad de tu casa',
      titulo: 'La mejor Tienda de regalos',
      descripcion: 'Buscamos representar los sentimientos de las personas en regalos que sean inolvidables',
      boton: 'Ver productos',
      imagen: 'accesorios/regalo.png',
    },
  ];

  indice = signal(0);

  slideActual = computed(() => this.slides[this.indice()]);

  siguiente(): void {
    this.indice.update(i => (i + 1) % this.slides.length);
  }

  anterior(): void {
    this.indice.update(i => (i - 1 + this.slides.length) % this.slides.length);
  }

  irA(indice: number): void {
    this.indice.set(indice);
  }
}