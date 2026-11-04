import { AnalyticsService } from '../../../../core/seguimiento/AnalyticsService';
import {
  AfterViewInit, Component, ElementRef, HostListener, OnDestroy, PLATFORM_ID, computed, effect, inject, signal, untracked
} from '@angular/core';
import { CurrencyPipe, DOCUMENT, NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
// AJUSTA la ruta según donde dejes carrito.service.ts
import { CarritoService, ProductoCarrito } from '../../../aplicacion/servicios/CarritoService';
import { productos } from '../../../../all-productos/dominio/muestra_producto';
import { EnvioGratisService } from '../../../../catalogo/aplicacion/servicios/EnvioGratisService';
import { macetaIgualSinConfirmar } from '../../../dominio/iguales';
import { Personalizador } from '../../../../personalizador/presentacion/paginas/personalizador/personalizador';

interface Sugerencia {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
  categoria?: string;  // para filtrar en las hojas "Elige otra maceta" / "Complementa tu regalo"
  slug?: string;       // solo macetas: producto al que corresponde
}

interface Categoria {
  clave: string;
  etiqueta: string;
}

@Component({
  selector: 'app-carrito',
  imports: [CurrencyPipe, NgTemplateOutlet, RouterLink, Personalizador],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class Carrito implements AfterViewInit, OnDestroy {

  // ===== EDITABLES: rutas de tu aplicación =====
  readonly RUTA_MACETAS = '/categorias';  // botón del carrito vacío
  readonly RUTA_SEGUIR = '/categorias';   // "Seguir comprando"
  readonly RUTA_CONTINUAR = '/checkout';  // "Continuar"

  // ===== EDITABLE: categorías de la hoja "Elige otra maceta" =====
  // "clave" es el campo `tipo` de tus productos. El orden de esta lista es el orden de las pestañas.
  // Las categorías sin productos disponibles no se muestran.
  readonly CATEGORIAS_MACETAS: Categoria[] = [
    { clave: 'profesionales', etiqueta: 'Profesiones y hobbies' },
    { clave: 'amor-amistad', etiqueta: 'Amor y amistad' },
    { clave: 'personaje', etiqueta: 'Personajes' },
    { clave: 'cuadro', etiqueta: 'Cuadros' },
  ];

  // ===== Otras macetas: salen de tus productos (muestra_producto.ts), solo los disponibles =====
  readonly macetas: Sugerencia[] = productos
    .filter(p => p.disponible)
    .map(p => ({
      id: String(p.id),
      nombre: p.nombre,
      precio: p.precio,
      imagen: p.imagen,
      categoria: p.tipo,
      slug: p.slug,
    }));

  // ===== EDITABLE: complementos (rutas de tus accesorios; el precio de cada uno es de ejemplo) =====
  readonly complementos: Sugerencia[] = [
    { id: 'acc-1', nombre: 'Lentes', imagen: 'accesorios/lentes.png', categoria: 'Moda', precio: 2 },
    { id: 'acc-5', nombre: 'Gafas', imagen: 'accesorios/gafas-sin-fondo.png', categoria: 'Moda', precio: 2 },
    { id: 'acc-3', nombre: 'Marco con foto', imagen: 'accesorios/marco-foto.png', categoria: 'Objetos', precio: 3 },
    { id: 'acc-4', nombre: 'Marco con frase', imagen: 'accesorios/marco-frase.png', categoria: 'Objetos', precio: 3 },
    { id: 'acc-6', nombre: 'Herramienta', imagen: 'accesorios/caja_herramientas.png', categoria: 'Objetos', precio: 3 },
    { id: 'acc-7', nombre: 'Regalo', imagen: 'accesorios/regalo.png', categoria: 'Objetos', precio: 2 },
    { id: 'acc-8', nombre: 'Vaso de café', imagen: 'accesorios/vaso_cafe.png', categoria: 'Objetos', precio: 2 },
    { id: 'acc-9', nombre: 'Gato amarillo', imagen: 'accesorios/gatito.png', categoria: 'Animales', precio: 3 },
    { id: 'acc-10', nombre: 'Perro', imagen: 'accesorios/perro.png', categoria: 'Animales', precio: 3 },
    { id: 'acc-11', nombre: 'Flor', imagen: 'accesorios/flores.png', categoria: 'Flores', precio: 2 },
  ];

  private carrito = inject(CarritoService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private document = inject(DOCUMENT);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  items = this.carrito.items;
  subtotal = this.carrito.subtotal;
  cantidad = this.carrito.cantidad;

  // Envío gratis desde 2 macetas (misma regla que el anuncio del navbar)
  envioGratis = inject(EnvioGratisService).envioGratis;

  // Complementos sin maceta: no se compran solos, así que se bloquea el checkout
  hayMacetas = computed(() => this.items().some(i => i.tipo === 'personalizado'));
  sinMaceta = computed(() => this.items().length > 0 && !this.hayMacetas());
  readonly MENSAJE_SIN_MACETA = 'Los complementos acompañan a una maceta. Agrega una maceta para continuar.';

  // Maceta idéntica a otra: se pregunta antes de seguir
  macetaIgual = computed(() => macetaIgualSinConfirmar(this.items()));

  confirmarIguales(): void {
    const item = this.macetaIgual();
    if (item) this.carrito.guardar({ ...item, igualConfirmada: true });
  }

  revisarIguales(): void {
    const item = this.macetaIgual();
    if (!item) return;
    this.itemsAlAbrir = this.items();
    this.editandoUid.set(item.uid);
    this.personalizando.set(item.producto);
  }

  textoProductos = computed(() => `${this.cantidad()} ${this.cantidad() === 1 ? 'producto' : 'productos'}`);

  // ----- Categorías de las hojas -----
  catsMacetas = computed<Categoria[]>(() => {
    const usadas = new Set(this.macetas.map(m => m.categoria));
    const conocidas = this.CATEGORIAS_MACETAS.filter(c => usadas.has(c.clave));
    const otras = [...usadas]
      .filter(t => t && !this.CATEGORIAS_MACETAS.some(c => c.clave === t))
      .map(t => ({ clave: t as string, etiqueta: t as string }));
    return [...conocidas, ...otras];
  });

  catsComplementos = computed<Categoria[]>(() =>
    [...new Set(this.complementos.map(c => c.categoria as string))].map(c => ({ clave: c, etiqueta: c }))
  );

  catMaceta = signal('');
  catComplemento = signal('');

  macetasDeCategoria = computed(() => {
    const cat = this.catMaceta() || this.catsMacetas()[0]?.clave;
    return this.macetas.filter(m => m.categoria === cat);
  });

  complementosDeCategoria = computed(() => {
    const cat = this.catComplemento() || this.catsComplementos()[0]?.clave;
    return this.complementos.filter(c => c.categoria === cat);
  });

  // ----- Hojas que suben de abajo hacia arriba -----
  hoja = signal<'macetas' | 'complementos' | null>(null);
  personalizando = signal<ProductoCarrito | null>(null);
  editandoUid = signal<string | null>(null);   // uid del item que se está editando (null = maceta nueva)
  private itemsAlAbrir: unknown = null;

  constructor() {
    inject(AnalyticsService).track('view_cart');
    // Bloquea el scroll de la página mientras hay una hoja abierta
    effect(() => {
      const abierta = this.hoja() !== null || this.personalizando() !== null;
      this.document.body.style.overflow = abierta ? 'hidden' : '';
    });

    // Cuando el personalizador guarda el detalle en el carrito (nuevo o editado), la hoja se cierra sola
    effect(() => {
      const lista = this.items();
      untracked(() => {
        if (this.personalizando() && lista !== this.itemsAlAbrir) this.cerrarPersonalizador();
      });
    });
  }

  abrirHoja(tipo: 'macetas' | 'complementos'): void {
    this.hoja.set(tipo);
  }

  cerrarHoja(): void {
    this.hoja.set(null);
  }

  // "+" de una maceta: sube el personalizador (90% de la pantalla) con ese producto
  personalizar(s: Sugerencia): void {
    this.hoja.set(null);
    this.itemsAlAbrir = this.items();
    this.editandoUid.set(null);
    this.personalizando.set({ id: s.slug ?? s.id, nombre: s.nombre, precio: s.precio, imagen: s.imagen });
  }

  cerrarPersonalizador(): void {
    this.personalizando.set(null);
    this.editandoUid.set(null);
  }

  // En celular, tocar el fondo oscuro cierra el personalizador (en pantallas grandes no, para no perder lo elegido)
  cerrarPorFondo(): void {
    if (this.document.defaultView?.matchMedia('(max-width: 767.98px)').matches) {
      this.cerrarPersonalizador();
    }
  }

  // ----- Confirmaciones: ¿editar? / ¿eliminar? -----
  confirmacion = signal<{ accion: 'editar' | 'eliminar'; uid: string } | null>(null);

  pedir(accion: 'editar' | 'eliminar', uid: string): void {
    this.confirmacion.set({ accion, uid });
  }

  @HostListener('document:keydown.escape')
  cancelar(): void {
    if (this.confirmacion()) {
      this.confirmacion.set(null);
    } else if (this.personalizando()) {
      this.cerrarPersonalizador();
    } else if (this.hoja()) {
      this.cerrarHoja();
    }
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

    // Editar: el personalizador sube aquí mismo, en el carrito, con lo que ya había elegido
    const item = this.carrito.buscar(c.uid);
    if (!item) return;

    this.itemsAlAbrir = this.items();
    this.editandoUid.set(c.uid);
    this.personalizando.set(item.producto);
  }

  // ----- Sugerencias (+) -----
  agregarSugerencia(s: Sugerencia, clave: string): void {
    if (clave === 'macetas') {
      this.personalizar(s);
      return;
    }

    this.agregarComplemento(s);
  }

  agregarComplemento(s: Sugerencia): void {
    if (this.enCarrito(s.id)) return;

    this.carrito.guardar({
      uid: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
      tipo: 'complemento',
      producto: { id: s.id, nombre: s.nombre, precio: s.precio, imagen: s.imagen },
      vista: '',
      ruta: '',
      resumen: [],
    });
  }

  // Un complemento ya agregado muestra ✓ en vez de "+"
  enCarrito(id: string): boolean {
    return this.items().some(i => i.tipo === 'complemento' && String(i.producto.id) === id);
  }

  marcado(clave: string, id: string): boolean {
    return clave === 'complementos' && this.enCarrito(id);
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
    // En el servidor no hay medidas reales (clientWidth es 0): solo se mide en el navegador
    if (!this.esNavegador) return;
    this.host.nativeElement.querySelectorAll<HTMLElement>('.pista').forEach(p => this.medir(p));
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.medirTodo());
  }

  @HostListener('window:resize')
  alCambiarTamano(): void {
    this.medirTodo();
  }

  ngOnDestroy(): void {
    this.document.body.style.overflow = '';
  }

}