import { Component, HostListener, computed, signal } from '@angular/core';
import { Producto, productos } from '../../../dominio/muestra_producto';
import { RouterLink } from '@angular/router';

export type Vista = 2 | 3 | 4 | 'lista';

@Component({
  imports: [RouterLink],
  selector: 'app-muestra-todos-productos',
  styleUrl: './muestra-todos-productos.css',
  templateUrl: './muestra-todos-productos.html',
})

export class MuestraTodosProductos {
  // ====== EDITABLE ======
  moneda = '$.';
  codigoMoneda = 'USD';
  productos = productos;

  opcionesOrden = [
    { valor: 'caracteristicas', texto: 'Características' },
    { valor: 'relevantes', texto: 'Más relevantes' },
    { valor: 'vendidos', texto: 'Más vendidos' },
    { valor: 'az', texto: 'Alfabéticamente, A-Z' },
    { valor: 'za', texto: 'Alfabéticamente, Z-A' },
    { valor: 'precio-asc', texto: 'Precio, menor a mayor' },
    { valor: 'precio-desc', texto: 'Precio, mayor a menor' },
    { valor: 'fecha-asc', texto: 'Fecha: antiguo(a) a reciente' },
    { valor: 'fecha-desc', texto: 'Fecha: reciente a antiguo(a)' },
  ];
  // =======================

  vista = signal<Vista>(2);
  orden = signal('vendidos');
  ordenAbierto = signal(false);
  ordenMovilAbierto = signal(false); // hoja de ordenar en celulares
  filtrosAbiertos = signal(false); // panel de filtros en pantallas pequeñas

  seccionAbierta = signal<Record<string, boolean>>({
    colecciones: true, disponibilidad: true, precio: true, tipo: true,
  });

  disponibilidadSel = signal<string[]>([]);
  tiposSel = signal<string[]>([]);
  coleccionesSel = signal<string[]>([]);

  readonly precioTope = Math.ceil(Math.max(...this.productos.map(p => p.precio)));
  precioMin = signal(0);
  precioMax = signal(this.precioTope);

  colecciones = this.contar(p => p.coleccion);
  tipos = this.contar(p => p.tipo);
  enExistencia = this.productos.filter(p => p.disponible).length;
  agotados = this.productos.filter(p => !p.disponible).length;

  textoOrdenActual = computed(
    () => this.opcionesOrden.find(o => o.valor === this.orden())?.texto ?? ''
  );

  productosFiltrados = computed(() => {
    const disp = this.disponibilidadSel();
    const tipos = this.tiposSel();
    const cols = this.coleccionesSel();
    const min = this.precioMin();
    const max = this.precioMax();

    const lista = this.productos.filter(p =>
      (!disp.length || (p.disponible ? disp.includes('existencia') : disp.includes('agotado'))) &&
      (!tipos.length || tipos.includes(p.tipo)) &&
      (!cols.length || cols.includes(p.coleccion)) &&
      p.precio >= min && p.precio <= max
    );

    switch (this.orden()) {
      case 'relevantes': lista.sort((a, b) => b.relevancia - a.relevancia); break;
      case 'vendidos': lista.sort((a, b) => b.vendidos - a.vendidos); break;
      case 'az': lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')); break;
      case 'za': lista.sort((a, b) => b.nombre.localeCompare(a.nombre, 'es')); break;
      case 'precio-asc': lista.sort((a, b) => a.precio - b.precio); break;
      case 'precio-desc': lista.sort((a, b) => b.precio - a.precio); break;
      case 'fecha-asc': lista.sort((a, b) => a.fecha.localeCompare(b.fecha)); break;
      case 'fecha-desc': lista.sort((a, b) => b.fecha.localeCompare(a.fecha)); break;
      default: break; // características: orden original
    }
    return lista;
  });

  // Porcentajes para pintar la barra del slider de precio
  relleno = computed(() => ({
    left: (this.precioMin() / this.precioTope) * 100 + '%',
    right: 100 - (this.precioMax() / this.precioTope) * 100 + '%',
  }));

  private contar(clave: (p: Producto) => string) {
    const mapa = new Map<string, number>();
    this.productos.forEach(p => mapa.set(clave(p), (mapa.get(clave(p)) ?? 0) + 1));
    return [...mapa.entries()].map(([nombre, cantidad]) => ({ nombre, cantidad }));
  }

  cambiarVista(v: Vista) { this.vista.set(v); }

  elegirOrden(valor: string) {
    this.orden.set(valor);
    this.ordenAbierto.set(false);
  }

  alternarSeccion(clave: string) {
    this.seccionAbierta.update(s => ({ ...s, [clave]: !s[clave] }));
  }

  alternar(senal: ReturnType<typeof signal<string[]>>, valor: string) {
    senal.update(l => (l.includes(valor) ? l.filter(x => x !== valor) : [...l, valor]));
  }

  cambiarMin(ev: Event) {
    const v = +(ev.target as HTMLInputElement).value;
    this.precioMin.set(Math.min(v, this.precioMax() - 1));
    (ev.target as HTMLInputElement).value = String(this.precioMin());
  }

  cambiarMax(ev: Event) {
    const v = +(ev.target as HTMLInputElement).value;
    this.precioMax.set(Math.max(v, this.precioMin() + 1));
    (ev.target as HTMLInputElement).value = String(this.precioMax());
  }

  limpiarFiltros() {
    this.disponibilidadSel.set([]);
    this.tiposSel.set([]);
    this.coleccionesSel.set([]);
    this.precioMin.set(0);
    this.precioMax.set(this.precioTope);
  }

  porcentajeDescuento(p: Producto) {
    return p.precioAnterior ? Math.round((1 - p.precio / p.precioAnterior) * 100) : 0;
  }

  formato(valor: number) {
    return `${this.moneda} ${valor.toFixed(2)}`;
  }

  @HostListener('document:click', ['$event'])
  cerrarOrden(ev: MouseEvent) {
    if (!(ev.target as HTMLElement).closest('.orden')) this.ordenAbierto.set(false);
  }
}