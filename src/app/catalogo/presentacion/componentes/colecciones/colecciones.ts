import { Component, ElementRef, OnDestroy, OnInit, signal, viewChild } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-colecciones',
  styleUrl: './colecciones.css',
  templateUrl: './colecciones.html',
})

export class Colecciones implements OnInit, OnDestroy {

  arrastrando = false;
  private ultimoX = 0;
  desplazamiento = signal(0); // cuántos píxeles se ha movido la fila hacia la izquierda
  private pausado = false; // true mientras el mouse está encima

  pista = viewChild<ElementRef<HTMLElement>>('pista');


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

  // La lista se repite dos veces para que al moverse nunca quede un hueco vacío
  coleccionesDobles: Coleccion[] = [...this.colecciones, ...this.colecciones];



  iniciarArrastre(event: PointerEvent): void {
    // Solo iniciar con el botón izquierdo del mouse
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    this.arrastrando = true;
    this.ultimoX = event.clientX;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }


  moverArrastre(event: PointerEvent): void {
    if (!this.arrastrando) {
      return;
    }
    // Arrastrar a la izquierda mueve la fila a la izquierda, y viceversa
    this.mover(this.ultimoX - event.clientX);
    this.ultimoX = event.clientX;
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

  // Ancho de UNA copia de la lista (la pista contiene la lista repetida dos veces)
  private anchoLista(): number {
    const pista = this.pista()?.nativeElement;
    return pista ? pista.scrollWidth / 2 : 0;
  }

  pausar(valor: boolean): void {
    this.pausado = valor;
  }

  // ===== Movimiento automático suave hacia la derecha =====
  private readonly velocidad = 40; // píxeles por segundo (más alto = más rápido)
  private idAnimacion = 0;
  private ultimoTiempo = 0;

  private animar = (tiempo: number): void => {
    const segundos = Math.min((tiempo - this.ultimoTiempo) / 1000, 0.1);
    this.ultimoTiempo = tiempo;

    // Se mueve solo si no se está arrastrando ni el mouse está encima.
    // Un valor negativo hace que las imágenes avancen hacia la derecha.
    if (!this.arrastrando && !this.pausado) {
      this.mover(-this.velocidad * segundos);
    }
    this.idAnimacion = requestAnimationFrame(this.animar);
  };

  ngOnInit(): void {
    this.ultimoTiempo = performance.now();
    this.idAnimacion = requestAnimationFrame(this.animar);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.idAnimacion);
  }





}