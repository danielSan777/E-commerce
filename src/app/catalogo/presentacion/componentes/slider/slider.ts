import { Component, ElementRef, OnDestroy, OnInit, signal, viewChild } from '@angular/core';

interface ProductoSlider {
  nombre: string;
  imagen: string;       // ruta de la imagen
  precio: number;
  agotado?: boolean;    // opcional: muestra la etiqueta "Agotado"
}

@Component({
  imports: [],
  selector: 'app-slider',
  styleUrl: './slider.css',
  templateUrl: './slider.html',
})
export class Slider implements OnInit, OnDestroy {

  titulo = 'Celebramos el amor';
  subtitulo = 'Envíale un regalo personalizado que jamás olvidará ¡Hoy!';

  // Productos del slider (cambie las rutas, nombres y precios por los suyos)
  productos: ProductoSlider[] = [
    { nombre: 'Amigo-guitarrista', imagen: 'imagenes/amor-amistad/Amigo-guitarrista.png', precio: 20, agotado: true },
    { nombre: 'Bob corazón Hombre', imagen: 'imagenes/amor-amistad/Bob corazón Hombre.png', precio: 25 },
    { nombre: 'Bob enamorado', imagen: 'imagenes/amor-amistad/Bob enamorado.png', precio: 20 },
    { nombre: 'Bob Mujer corazón', imagen: 'imagenes/amor-amistad/Bob Mujer corazón.png', precio: 25 },
    { nombre: 'Bob serenata', imagen: 'imagenes/amor-amistad/Bob serenata.png', precio: 20, agotado: true },
    { nombre: 'Caballero enamorado', imagen: 'imagenes/amor-amistad/Caballero enamorado.png', precio: 25 },
    { nombre: 'Damisela enamorada', imagen: 'imagenes/amor-amistad/Damisela enamorada.png', precio: 25 },
    { nombre: 'Pareja con corazón', imagen: 'imagenes/amor-amistad/Pareja con corazón.png', precio: 26 },
    { nombre: 'Pareja Juntos por siempre', imagen: 'imagenes/amor-amistad/Pareja Juntos por siempre.png', precio: 26 },
    { nombre: 'Pareja con corazón#2', imagen: 'imagenes/amor-amistad/Pareja con corazón_2.png', precio: 26 },
    { nombre: 'Señorita enamorada', imagen: 'imagenes/amor-amistad/Señorita enamorada.png', precio: 26 }
  ];

  // La lista se repite 3 veces para que siempre haya imágenes a ambos lados (carrusel infinito)
  productosTriples: ProductoSlider[] = [...this.productos, ...this.productos, ...this.productos];

  // ===== Movimiento =====
  private readonly velocidad = 40;      // píxeles por segundo hacia la derecha (cambie para más rápido o lento)
  private readonly duracionPaso = 600;  // milisegundos que tarda el cambio con las flechas o los puntos

  pista = viewChild<ElementRef<HTMLElement>>('pista');
  desplazamiento = signal(0);   // píxeles que se mueve la fila (se usa en el transform)
  indiceActivo = signal(0);     // punto activo

  private bruta = 0;            // posición sin límites (baja con el tiempo = la fila va hacia la derecha)
  private pausado = false;
  private reducirMovimiento = false;
  private idAnimacion = 0;
  private ultimoTiempo = 0;
  private animacion?: { desde: number; hasta: number; inicio: number };

  // Distancia entre el inicio de una tarjeta y el inicio de la siguiente
  private paso(): number {
    const hijos = this.pista()?.nativeElement.children;
    if (!hijos || hijos.length < 2) {
      return 0;
    }
    return (hijos[1] as HTMLElement).offsetLeft - (hijos[0] as HTMLElement).offsetLeft;
  }

  private fijar(valor: number): void {
    const paso = this.paso();
    const largo = paso * this.productos.length; // ancho de UNA copia de la lista
    if (!largo) {
      return;
    }
    this.bruta = valor;
    const dentro = ((valor % largo) + largo) % largo;
    this.desplazamiento.set(largo + dentro);     // se usa la copia del medio
    this.indiceActivo.set(Math.round(dentro / paso) % this.productos.length);
  }

  private animar = (tiempo: number): void => {
    const segundos = Math.min((tiempo - this.ultimoTiempo) / 1000, 0.1);
    this.ultimoTiempo = tiempo;

    if (this.animacion) {
      const progreso = Math.min((tiempo - this.animacion.inicio) / this.duracionPaso, 1);
      const suave = 1 - Math.pow(1 - progreso, 3); // empieza rápido y termina suave
      this.fijar(this.animacion.desde + (this.animacion.hasta - this.animacion.desde) * suave);
      if (progreso >= 1) {
        this.animacion = undefined;
      }
    } else if (!this.pausado && !this.reducirMovimiento) {
      this.fijar(this.bruta - this.velocidad * segundos); // baja = las imágenes avanzan hacia la derecha
    } else {
      this.fijar(this.bruta); // mantiene el tamaño correcto si se redimensiona la ventana
    }

    this.idAnimacion = requestAnimationFrame(this.animar);
  };

  pausar(valor: boolean): void {
    this.pausado = valor;
  }

  // Flecha izquierda: mover(-1)  |  flecha derecha: mover(1)
  mover(pasos: number): void {
    const paso = this.paso();
    if (!paso) {
      return;
    }
    const base = Math.round(this.bruta / paso) * paso;
    this.animacion = { desde: this.bruta, hasta: base + pasos * paso, inicio: performance.now() };
  }

  // Punto: va por el camino más corto hasta esa imagen
  irA(indice: number): void {
    const total = this.productos.length;
    let diferencia = indice - this.indiceActivo();
    if (diferencia > total / 2) {
      diferencia -= total;
    }
    if (diferencia < -total / 2) {
      diferencia += total;
    }
    this.mover(diferencia);
  }

  formatoPrecio(valor: number): string {
    return `$. ${valor.toFixed(2)}`;
  }

  ngOnInit(): void {
    this.reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.ultimoTiempo = performance.now();
    this.idAnimacion = requestAnimationFrame(this.animar);
  }


  ngOnDestroy(): void {
    cancelAnimationFrame(this.idAnimacion);
  }


}