import { Component, ElementRef, signal, viewChild } from '@angular/core';

interface Categoria {
  nombre: string;
  imagen: string;
}

@Component({
  selector: 'app-todas-categorias',
  styleUrl: './todas-categorias.css',
  templateUrl: './todas-categorias.html',
})

export class TodasCategorias {

  readonly categorias: Categoria[] = [
    { nombre: 'Amor & Amistad', imagen: 'imagenes/all-productos/enamorado.png' },
    { nombre: 'Profesiones', imagen: 'imagenes/all-productos/veterinario.png' },
    { nombre: 'Personajes', imagen: 'imagenes/all-productos/homero.png' }
  ]

  readonly puedeDeslizarIzquierda = signal(false);
  readonly puedeDeslizarDerecha = signal(true);
  private readonly visor = viewChild<ElementRef<HTMLElement>>('visor');

  mover(direccion: -1 | 1): void {
    const visor = this.visor()?.nativeElement;
    const tarjeta = visor?.querySelector<HTMLElement>('.categoria');

    if (!visor || !tarjeta) {
      return;
    }

    const estilos = getComputedStyle(visor);
    const espacio = Number.parseFloat(estilos.columnGap) || 0;
    visor.scrollBy({
      left: direccion * (tarjeta.getBoundingClientRect().width + espacio),
      behavior: 'smooth',
    });
  }

  actualizarControles(event: Event): void {
    const visor = event.currentTarget as HTMLElement;
    const maximoDesplazamiento = visor.scrollWidth - visor.clientWidth;

    this.puedeDeslizarIzquierda.set(visor.scrollLeft > 1);
    this.puedeDeslizarDerecha.set(visor.scrollLeft < maximoDesplazamiento - 1);
  }
}
