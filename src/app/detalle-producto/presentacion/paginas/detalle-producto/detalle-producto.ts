import { Component, computed, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Producto } from '../../../../all-productos/dominio/muestra_producto';
import { productos } from '../../../../all-productos/dominio/muestra_producto';

@Component({
  imports: [RouterLink],
  selector: 'app-detalle-producto',
  styleUrl: './detalle-producto.css',
  templateUrl: './detalle-producto.html',
})

export class DetalleProducto {
  private route = inject(ActivatedRoute);
  private document = inject(DOCUMENT);

  // ====== EDITABLE ======
  moneda = '$.';
  codigoMoneda = 'USD';
  rutaListado = '/productos';
  textoListado = 'Productos';
  maxDedicatoria = 250;
  maxMbFoto = 5;
  // =======================

  // Nombre del producto que viene en la ruta (ej: /productos/Abogada)
  private parametros = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  nombre = computed(() => this.parametros().get('producto'));

  producto = computed<Producto | undefined>(() =>
    productos.find(p => p.slug === this.nombre())
  );

  // Dedicatoria
  dedicatoria = signal('');

  // Foto
  fotoUrl = signal<string | null>(null);
  fotoNombre = signal('');
  errorFoto = signal('');

  // Fecha de entrega (obligatoria)
  fechaEntrega = signal('');
  fechaTocada = signal(false);
  readonly hoy = this.fechaLocal(new Date());
  errorFecha = computed(() => {
    if (!this.fechaTocada()) return '';
    const f = this.fechaEntrega();
    if (!f) return 'La fecha de entrega es obligatoria.';
    if (f < this.hoy) return 'La fecha no puede ser anterior a hoy.';
    return '';
  });

  agregado = signal(false);

  // Compartir
  compartirAbierto = signal(false);
  copiado = signal(false);
  verImagen = signal(false);

  enlace = computed(() => {
    this.nombre(); // se recalcula si cambia el producto
    return this.document.location?.href ?? '';
  });

  enlaceFacebook = computed(() => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.enlace())}`);
  enlaceTwitter = computed(() => `https://twitter.com/intent/tweet?url=${encodeURIComponent(this.enlace())}&text=${encodeURIComponent(this.producto()?.nombre ?? '')}`);
  enlacePinterest = computed(() => `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(this.enlace())}&description=${encodeURIComponent(this.producto()?.nombre ?? '')}`);

  porcentajeDescuento = computed(() => {
    const p = this.producto();
    return p?.precioAnterior ? Math.round((1 - p.precio / p.precioAnterior) * 100) : 0;
  });

  formato(valor: number) {
    return `${this.moneda} ${valor.toFixed(2)}`;
  }

  escribirDedicatoria(ev: Event) {
    this.dedicatoria.set((ev.target as HTMLTextAreaElement).value.slice(0, this.maxDedicatoria));
  }

  elegirFoto(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    this.errorFoto.set('');
    if (!archivo.type.startsWith('image/')) {
      this.errorFoto.set('Elige un archivo de imagen.');
      input.value = '';
      return;
    }
    if (archivo.size > this.maxMbFoto * 1024 * 1024) {
      this.errorFoto.set(`La imagen no debe pesar más de ${this.maxMbFoto} MB.`);
      input.value = '';
      return;
    }
    this.quitarUrl();
    this.fotoUrl.set(URL.createObjectURL(archivo));
    this.fotoNombre.set(archivo.name);
  }

  quitarFoto(input: HTMLInputElement) {
    this.quitarUrl();
    this.fotoUrl.set(null);
    this.fotoNombre.set('');
    input.value = '';
  }

  private quitarUrl() {
    const actual = this.fotoUrl();
    if (actual) URL.revokeObjectURL(actual);
  }

  cambiarFecha(ev: Event) {
    this.fechaEntrega.set((ev.target as HTMLInputElement).value);
    this.fechaTocada.set(true);
    this.agregado.set(false);
  }

  agregarAlCarrito() {
    this.fechaTocada.set(true);
    if (this.errorFecha()) return;
    // Aquí va la lógica de tu carrito. Datos del pedido:
    console.log({
      producto: this.producto(),
      dedicatoria: this.dedicatoria(),
      foto: this.fotoNombre(),
      fechaEntrega: this.fechaEntrega(),
    });
    this.agregado.set(true);
  }

  async copiarEnlace(campo: HTMLInputElement) {
    try {
      await navigator.clipboard.writeText(this.enlace());
    } catch {
      campo.select();
      this.document.execCommand('copy');
    }
    this.copiado.set(true);
    setTimeout(() => this.copiado.set(false), 2000);
  }

  private fechaLocal(d: Date) {
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
  }
}