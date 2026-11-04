
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
import { TIENDA } from '../../../configuracion/tienda';
import { CatalogoMenu } from '../../../../catalogo/dominio/entidades/catalogo';
// AJUSTA la ruta si tu carpeta carrito está en otro lugar
import { EnvioGratisService } from '../../../../catalogo/aplicacion/servicios/EnvioGratisService';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
})

export class Navbar {

  readonly telefono = TIENDA.telefono;   // se cambia en core/configuracion/tienda.ts

  // ===== Anuncio rojo de envío gratis (solo en la pantalla principal) =====
  // EDITABLE: ruta de la pantalla principal (la ruta '' redirige a 'catalogo')
  readonly RUTA_INICIO = '/catalogo';

  private router = inject(Router);
  envio = inject(EnvioGratisService);

  private url = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );

  // Solo en /catalogo exacto (sin contar ?parámetros ni #ancla); en /catalogo/macetas, /carrito, etc. no sale
  esInicio = computed(() => {
    const ruta = this.url().split(/[?#]/)[0].replace(/\/+$/, '');
    return ruta === '' || ruta === this.RUTA_INICIO;
  });

  anuncioCerrado = signal(false);
  mostrarAnuncio = computed(() => this.esInicio() && !this.anuncioCerrado());

  cerrarAnuncio(): void {
    this.anuncioCerrado.set(true);
  }

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