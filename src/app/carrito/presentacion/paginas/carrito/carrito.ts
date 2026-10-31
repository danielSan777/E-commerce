import {
  AfterViewInit, Component, ElementRef, HostListener, computed, inject, signal
} from '@angular/core';
import { CurrencyPipe, NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
// AJUSTA la ruta según donde dejes carrito.service.ts
import { CarritoService } from '../../../aplicacion/servicios/CarritoService';
import { productos } from '../../../../all-productos/dominio/muestra_producto';

interface Sugerencia {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
  ruta?: string;   // a dónde lleva el "+" (solo macetas)
}

@Component({
  selector: 'app-carrito',
  imports: [CurrencyPipe, NgTemplateOutlet, RouterLink],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class Carrito implements AfterViewInit {

  // ===== EDITABLES: rutas de tu aplicación =====
  readonly RUTA_MACETAS = '/catalogo/todos-productos';  // "Ver más macetas" y botón del carrito vacío
  readonly RUTA_SEGUIR = '/catalogo/todos-productos';   // "Seguir comprando"
  readonly RUTA_CONTINUAR = '/checkout';  // "Continuar"

  // ===== Otras macetas personalizadas: salen de tus productos reales (tipo "profesionales") =====
  // Para mostrar otro tipo, cambia 'profesionales' (o quita el filtro para mostrar todas).
  readonly macetas: Sugerencia[] = productos
    .filter(p => p.tipo === 'profesionales' && p.disponible)
    .map(p => ({
      id: String(p.id),
      nombre: p.nombre,
      precio: p.precio,
      imagen: p.imagen,
      ruta: `/catalogo/todos-productos/${p.slug}`,
    }));

  // ===== EDITABLE: complementos (cambia las imágenes por las tuyas) =====

  readonly complementos: Sugerencia[] = [
    { id: 'marco-con-foto', nombre: 'Marco con foto', precio: 3, imagen: 'imagenes/complementos/marco-con-foto.png' },
    { id: 'tarjeta', nombre: 'Tarjeta de dedicatoria', precio: 1.5, imagen: 'imagenes/complementos/tarjeta.png' },
    { id: 'mascota', nombre: 'Mascota personalizada', precio: 3, imagen: 'imagenes/complementos/mascota.png' },
    { id: 'accesorio-extra', nombre: 'Accesorio extra', precio: 1.5, imagen: 'imagenes/complementos/accesorio-extra.png' },
  ];

  private carrito = inject(CarritoService);
  private router = inject(Router);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  items = this.carrito.items;
  subtotal = this.carrito.subtotal;
  cantidad = this.carrito.cantidad;

  textoProductos = computed(() => `${this.cantidad()} ${this.cantidad() === 1 ? 'producto' : 'productos'}`);

  // ----- Confirmaciones: ¿editar? / ¿eliminar? -----
  confirmacion = signal<{ accion: 'editar' | 'eliminar'; uid: string } | null>(null);

  pedir(accion: 'editar' | 'eliminar', uid: string): void {
    this.confirmacion.set({ accion, uid });
  }

  @HostListener('document:keydown.escape')
  cancelar(): void {
    this.confirmacion.set(null);
  }

  confirmar(): void {
    const c = this.confirmacion();
    if (!c) return;

    this.confirmacion.set(null);

    if (c.accion === 'eliminar') {
      this.carrito.quitar(c.uid);
      setTimeout(() => this.medirTodo()); // si quedó vacío, se vuelve a medir el carrusel de abajo
      return;
    }

    // Editar: vuelve a la pantalla donde se personalizó, con lo que ya había elegido
    const item = this.carrito.buscar(c.uid);
    if (!item) return;

    // Vuelve a la pantalla del producto (donde sale el personalizador) con lo elegido
    const ruta = item.ruta || `/catalogo/todos-productos/${item.producto.id}`;
    void this.router.navigate([ruta], { queryParams: { editar: c.uid } });
  }

  // ----- Sugerencias (+) -----
  agregarSugerencia(s: Sugerencia, clave: string): void {
    if (clave === 'macetas') {
      void this.router.navigate([s.ruta ?? this.RUTA_MACETAS]);
      return;
    }

    this.carrito.guardar({
      uid: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
      tipo: 'complemento',
      producto: { id: s.id, nombre: s.nombre, precio: s.precio, imagen: s.imagen },
      vista: '',
      ruta: '',
      resumen: [],
    });
  }

  // Si la imagen no existe (todavía), se oculta y queda el fondo de la tarjeta
  sinImagen(evento: Event): void {
    (evento.target as HTMLImageElement).style.visibility = 'hidden';
  }

  // ----- Carruseles: flechas, puntos y deslizar con el dedo -----
  paginas = signal<Record<string, { n: number; i: number }>>({});

  puntos(clave: string): number[] {
    return Array.from({ length: this.paginas()[clave]?.n ?? 1 }, (_, i) => i);
  }

  puntoActivo(clave: string): number {
    return this.paginas()[clave]?.i ?? 0;
  }

  mover(pista: HTMLElement, direccion: number): void {
    pista.scrollBy({ left: direccion * pista.clientWidth * 0.9, behavior: 'smooth' });
  }

  medir(pista: HTMLElement): void {
    const clave = pista.dataset['clave'] ?? '';
    if (!clave || !pista.clientWidth) return;

    const n = Math.max(1, Math.ceil(pista.scrollWidth / pista.clientWidth - 0.05));
    const i = Math.min(n - 1, Math.max(0, Math.round(pista.scrollLeft / (pista.clientWidth * 0.9))));

    const actual = this.paginas()[clave];
    if (actual && actual.n === n && actual.i === i) return;

    this.paginas.update(p => ({ ...p, [clave]: { n, i } }));
  }

  private medirTodo(): void {
    this.host.nativeElement.querySelectorAll<HTMLElement>('.pista').forEach(p => this.medir(p));
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.medirTodo());
  }

  @HostListener('window:resize')
  alCambiarTamano(): void {
    this.medirTodo();
  }
}