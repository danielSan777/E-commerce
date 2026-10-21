import { Component, HostListener, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CatalogoMenu } from '../../../../catalogo/dominio/entidades/catalogo';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
})
export class Navbar {

  // Sidebar (pantallas menores a 992px)
  menuAbierto = signal(false);
  pestana = signal<'menu' | 'categorias'>('menu');

  catalogos = signal<CatalogoMenu[]>([
    {
      id: 1,
      nombre: 'Inicio',
      slug: '',
      icono: 'bi-house-door'
    },
    {
      id: 2,
      nombre: 'Amor & Amistad',
      slug: 'macetas',
      icono: 'bi-heart'
    },
    {
      id: 3,
      nombre: 'Profesiones',
      slug: 'profesionales',
      icono: 'bi-briefcase'
    },
    {
      id: 4,
      nombre: 'Personajes',
      slug: 'personajes',
      icono: 'bi-stars'
    }
  ]);

  // Pestaña CATEGORÍAS: los catálogos sin "Inicio"
  categorias = computed(() => this.catalogos().filter(c => c.slug));

  abrir(): void {
    this.pestana.set('menu');
    this.menuAbierto.set(true);
    document.body.style.overflow = 'hidden'; // evita que la página se mueva detrás del sidebar
  }

  cerrar(): void {
    this.menuAbierto.set(false);
    document.body.style.overflow = '';
  }

  // Esc cierra el sidebar
  @HostListener('document:keydown.escape')
  alPresionarEscape(): void {
    if (this.menuAbierto()) this.cerrar();
  }

  // Si la pantalla pasa a "grande", se cierra el sidebar
  @HostListener('window:resize')
  alCambiarTamano(): void {
    if (this.menuAbierto() && window.innerWidth >= 992) this.cerrar();
  }
}