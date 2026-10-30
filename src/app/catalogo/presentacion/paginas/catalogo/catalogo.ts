import {
  Component, ElementRef, computed, signal, viewChild, OnInit,
  OnDestroy, Inject, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Colecciones } from '../../componentes/colecciones/colecciones';
import { Productos } from '../../componentes/productos/productos';
import { Dedicatoria } from '../../componentes/dedicatoria/dedicatoria';
import { Slider } from '../../componentes/slider/slider';
import { SobreNosotros } from '../../componentes/sobre-nosotros/sobre-nosotros';
import { Informacion } from '../../componentes/informacion/informacion';
import { RouterLink } from '@angular/router';

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
  ruta: string;
}

@Component({
  imports: [Colecciones, Productos, Dedicatoria, Slider, SobreNosotros, Informacion, RouterLink],
  selector: 'app-catalogo',
  styleUrl: './catalogo.css',
  templateUrl: './catalogo.html',
})
/* ancho:411px
alto:780px */
export class Catalogo implements OnInit, OnDestroy {


  private temporizador?: ReturnType<typeof setInterval>;

  // ===== Colecciones: carrusel infinito que se mueve solo y también se arrastra con el mouse o el dedo =====
  // La pista se mueve con transform (no con scroll) y su posición se reinicia con módulo,
  // así nunca llega a un final: al arrastrar hacia cualquier lado las imágenes siguen apareciendo.

  private readonly velocidad = 60; // píxeles por segundo (cambie este número para ir más rápido o más lento)

  pista = viewChild<ElementRef<HTMLElement>>('pista');
  desplazamiento = signal(0); // cuántos píxeles se ha movido la fila hacia la izquierda
  arrastrando = false;

  private pausado = false; // true mientras el mouse está encima

  private idAnimacion = 0;
  private ultimoTiempo = 0;

  private esNavegador: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.esNavegador = isPlatformBrowser(platformId);
  }


  ngOnDestroy(): void {
    if (!this.esNavegador) {
      return;
    }
    if (this.temporizador) {
      clearInterval(this.temporizador);
    }
    cancelAnimationFrame(this.idAnimacion);
  }

  ngOnInit(): void {
    if (!this.esNavegador) {
      return;
    }
    this.temporizador = setInterval(() => {
      this.siguiente();
    }, 3000);

    this.idAnimacion = requestAnimationFrame(this.animar);
  }


  // Ancho de UNA copia de la lista (la pista contiene la lista repetida dos veces)
  private anchoLista(): number {
    const pista = this.pista()?.nativeElement;
    return pista ? pista.scrollWidth / 2 : 0;
  }

  private mover(pixeles: number): void {
    const ancho = this.anchoLista();
    if (!ancho) {
      return;
    }
    // Se mantiene entre 0 y el ancho de una lista: al pasar el límite "da la vuelta" sin que se note
    let nuevo = (this.desplazamiento() + pixeles) % ancho;
    if (nuevo < 0) {
      nuevo += ancho;
    }
    this.desplazamiento.set(nuevo);
  }


  private animar = (tiempo: number): void => {
    const segundos = Math.min((tiempo - this.ultimoTiempo) / 1000, 0.1);
    this.ultimoTiempo = tiempo;

    if (!this.arrastrando && !this.pausado) {
      this.mover(this.velocidad * segundos);
    }
    this.idAnimacion = requestAnimationFrame(this.animar);
  };

  pausar(valor: boolean): void {
    this.pausado = valor;
  }





  terminarArrastre(event: PointerEvent): void {
    if (!this.arrastrando) {
      return;
    }
    this.arrastrando = false;

    const visor = event.currentTarget as HTMLElement;
    if (visor.hasPointerCapture(event.pointerId)) {
      visor.releasePointerCapture(event.pointerId);
    }
  }

  // Cada diapositiva: su texto, su botón y su imagen (cambie las rutas de las imágenes por las suyas)
  slides: Slide[] = [
    {
      id: 1,
      pregunta: 'Los regalos mas bonitos del Ecuador',
      titulo: 'Bienvenidos a Jardín de Sele',
      descripcion: 'regalos llenos de vida que adornaran tu espacio o el de esa persona especial',
      boton: 'Ver Productos',
      imagen: 'imagenes/amor.png',
      ruta: "todos-productos"
    },
    {
      id: 2,
      pregunta: '¿No sabes qué regalar?',
      titulo: 'Crea tu propia maceta',
      descripcion: 'Elige los accesorios y personaliza tu maceta con el nombre de esa persona especial',
      boton: 'Personalizar',
      imagen: 'imagenes/doctor3D.png',
      ruta: "todos-productos"
    },
    {
      id: 3,
      pregunta: 'compra desde la comodidad de tu casa',
      titulo: 'La mejor Tienda de regalos',
      descripcion: 'Buscamos representar los sentimientos de las personas en regalos que sean inolvidables',
      boton: 'Ver productos',
      imagen: 'imagenes/pato.png',
      ruta: "todos-productos"
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

  probarClick(): void {
    console.log('El botón recibió el clic');
  }


}