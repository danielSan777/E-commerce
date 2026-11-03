import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Producto } from '../../../../all-productos/dominio/muestra_producto';
import { productos } from '../../../../all-productos/dominio/muestra_producto';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { Personalizador } from '../../../../personalizador/presentacion/paginas/personalizador/personalizador';
import { PromesaService } from '../../../../checkout/aplicacion/servicios/PromesaService';
import { NoEncontrada } from '../../../../core/paginas/no-encontrada/no-encontrada';
import { ProductoCarrito } from '../../../../carrito/aplicacion/servicios/CarritoService';

@Component({
  imports: [RouterLink, Personalizador, NoEncontrada],
  selector: 'app-detalle-producto',
  styleUrl: './detalle-producto.css',
  templateUrl: './detalle-producto.html',
})

export class DetalleProducto implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private document = inject(DOCUMENT);
  private location = inject(Location);
  private promesas = inject(PromesaService);
  // ====== EDITABLE ======
  moneda = '$.';
  codigoMoneda = 'USD';
  rutaListado = 'todos-productos';
  textoListado = 'Productos';
  // =======================
  private router = inject(Router);
  // Nombre del producto que viene en la ruta (ej: /productos/Abogada)
  private parametros = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  nombre = computed(() => this.parametros().get('producto'));

  producto = computed<Producto | undefined>(() =>
    productos.find(p => p.slug === this.nombre())
  );

  // Datos del producto que se envían al carrito (nombre y precio salen del producto)
  productoCarrito = computed<ProductoCarrito | null>(() => {
    const p = this.producto();
    return p ? { id: p.slug, nombre: p.nombre, precio: p.precio, imagen: p.imagen } : null;
  });

  // Promesa de entrega: la calcula Laravel (hoy, un mock del Paso 0); Angular solo muestra label y countdown_label
  promesa = this.promesas.promesa();

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


  personalizadorAbierto = signal(false);

  formato(valor: number) {
    return `${this.moneda} ${valor.toFixed(2)}`;
  }

  personalizar() {



    //this.router.navigate(['/catalogo/todos-productos/personalizador']);



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

  volverAtras(event: Event) {
    event.preventDefault();
    // Si hay una página anterior dentro de tu tienda, regresa a ella.
    if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)) {
      this.location.back();
    } else {
      // Si entró directamente, ir al listado de productos.
      this.router.navigate(['/catalogo/todos-productos']);
    }
  }

  // En celular el personalizador sube desde abajo (hoja); en pantalla media y grande es un modal.
  // El cambio de aspecto lo hace el CSS; aquí solo se bloquea el scroll de la página de atrás.
  abrirPersonalizador(): void {
    this.personalizadorAbierto.set(true);
    this.document.body.style.overflow = 'hidden';
  }

  cerrarPersonalizador(): void {
    this.personalizadorAbierto.set(false);
    this.document.body.style.overflow = '';

    // Si venía de "Editar" en el carrito, se quita ?editar de la dirección
    if (this.route.snapshot.queryParamMap.has('editar')) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { editar: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  // "Editar" en el carrito llega aquí con ?editar=...: se abre el personalizador con lo elegido
  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.has('editar')) {
      this.abrirPersonalizador();
    }
  }

  // Tocar el fondo oscuro cierra la hoja, pero solo en celular
  // (en pantallas grandes no, para no perder lo elegido sin querer)
  cerrarPorFondo(): void {
    if (this.document.defaultView?.matchMedia('(max-width: 767.98px)').matches) {
      this.cerrarPersonalizador();
    }
  }

  // Cuando el personalizador emite "guardar", cierra el modal
  guardarPersonalizacion(config: any): void {
    // Aquí puedes procesar la configuración (nombre, accesorios, dedicatoria, foto, color lentes)
    // Por ahora solo cerramos
    console.log('Configuración guardada:', config);
    this.cerrarPersonalizador();
    this.agregado.set(true);
  }

  ngOnDestroy(): void {
    this.document.body.style.overflow = '';
  }




}