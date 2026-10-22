import {
  Component, computed, signal, OnInit,
  OnDestroy
} from '@angular/core';

interface Slide {
  id: number;
  pregunta: string;
  titulo: string;
  descripcion: string;
  boton: string;
  imagen: string;
  // Cómo se ajusta la imagen al círculo (opcional):
  //  'cover'   = llena todo el círculo (recorta lo que sobra)  ← por defecto
  //  'contain' = se ve completa, pero deja franjas blancas si no es cuadrada
  ajuste?: 'cover' | 'contain';
  // Qué parte de la imagen queda visible cuando se recorta (opcional), ej. 'center top', '30% 50%'
  posicion?: string;
}

interface Coleccion {
  nombre: string;
  imagen: string;
}

@Component({
  imports: [],
  selector: 'app-catalogo',
  styleUrl: './catalogo.css',
  templateUrl: './catalogo.html',
})
/* ancho:411px
alto:780px */
export class Catalogo implements OnInit, OnDestroy {


  private temporizador?: ReturnType<typeof setInterval>;

  ngOnDestroy(): void {

    if (this.temporizador) {
      clearInterval(this.temporizador);
    }

  }


  ngOnInit(): void {

    this.temporizador = setInterval(() => {
      this.siguiente();
    }, 3000);

  }





  // Cada diapositiva: su texto, su botón y su imagen (cambie las rutas de las imágenes por las suyas)
  slides: Slide[] = [
    {
      id: 1,
      pregunta: 'Los regalos mas bonitos del Ecuador',
      titulo: 'Bienvenidos a El Jardín de Sele',
      descripcion: 'regalos llenos de vida que adornaran tu espacio o el de esa persona especial',
      boton: 'Ver Productos',
      imagen: 'imagenes/amor.png'
    },
    {
      id: 2,
      pregunta: '¿No sabes qué regalar?',
      titulo: 'Crea tu propia maceta',
      descripcion: 'Elige los accesorios y personaliza tu maceta con el nombre de esa persona especial',
      boton: 'Personalizar',
      imagen: 'imagenes/doctor3D.png'
    },
    {
      id: 3,
      pregunta: 'compra desde la comodidad de tu casa',
      titulo: 'La mejor Tienda de regalos',
      descripcion: 'Buscamos representar los sentimientos de las personas en regalos que sean inolvidables',
      boton: 'Ver productos',
      imagen: 'imagenes/pato.png',
    },
  ];

  // Colecciones que se muestran en círculos (cambie las rutas por las de sus imágenes)
  colecciones: Coleccion[] = [
    { nombre: 'profesiones', imagen: 'imagenes/colecciones/abogado.png' },
    { nombre: 'Amor & Amistad', imagen: 'imagenes/colecciones/bob-serenata.png' },
    { nombre: 'Personajes', imagen: 'imagenes/colecciones/chica_superpoderosa.png' },
    { nombre: 'profesiones', imagen: 'imagenes/colecciones/maestro.png' },
    { nombre: 'Amor & Amistad', imagen: 'imagenes/colecciones/pareja-juntos.png' },
    { nombre: 'Personajes', imagen: 'imagenes/colecciones/personajes.png' },
    { nombre: 'Amor & Amistad', imagen: 'imagenes/colecciones/senorita.png' },
    { nombre: 'profesiones', imagen: 'imagenes/colecciones/veterinario.png' }
  ];

  // La lista se repite dos veces para que al desplazarse nunca quede un hueco vacío
  coleccionesDobles: Coleccion[] = [...this.colecciones, ...this.colecciones];

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