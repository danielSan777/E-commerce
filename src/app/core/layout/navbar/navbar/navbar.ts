import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CatalogoMenu } from '../../../../catalogo/dominio/entidades/catalogo';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
})

export class Navbar {

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




}
