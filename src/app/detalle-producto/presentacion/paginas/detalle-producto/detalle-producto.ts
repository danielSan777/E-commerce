import { Component, OnDestroy, PLATFORM_ID, afterNextRender, computed, effect, inject, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { Producto } from '../../../../all-productos/dominio/muestra_producto';
import { productos } from '../../../../all-productos/dominio/muestra_producto';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { Personalizador } from '../../../../personalizador/presentacion/paginas/personalizador/personalizador';
import { PromesaService } from '../../../../checkout/aplicacion/servicios/PromesaService';
import { CheckoutService } from '../../../../checkout/aplicacion/servicios/CheckoutService';
import { VentanaDisponible } from '../../../../checkout/dominio/interfaces/promesa';
import { textoVentana } from '../../../../checkout/dominio/validaciones/fechas';
import { ENVIO_DESDE } from '../../../../checkout/dominio/validaciones/envio';
import { EnvioGratisService } from '../../../../catalogo/aplicacion/servicios/EnvioGratisService';
import { NoEncontrada } from '../../../../core/paginas/no-encontrada/no-encontrada';
import { ProductoCarrito } from '../../../../carrito/aplicacion/servicios/CarritoService';

@Component({
  imports: [RouterLink, Personalizador, NoEncontrada],
  selector: 'app-detalle-producto',
  styleUrl: './detalle-producto.css',
  templateUrl: './detalle-producto.html',
})

export class DetalleProducto implements OnDestroy {
  private route = inject(ActivatedRoute);
  private document = inject(DOCUMENT);
  private location = inject(Location);
  private promesas = inject(PromesaService);
  private checkout = inject(CheckoutService);
  private envioGratis = inject(EnvioGratisService);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));
  // ====== EDITABLE ======
  moneda = '$.';
  codigoMoneda = 'USD';
  rutaListado = 'todos-productos';
  textoListado = 'Productos';

  // Textos de la ficha. Son los valores de ejemplo del contrato del Paso 0; con backend llegan en cada producto.
  readonly INCLUYE = ['Plantita natural', 'Dedicatoria personalizada', 'Funda kraft'];
  readonly TAMANO_TEXTO = 'Base 14 × 7 cm';
  readonly MATERIAL_TEXTO = 'Impresa en 3D con PLA Plus';
  // =======================
  private router = inject(Router);
  // Nombre del producto que viene en la ruta (ej: /productos/Abogada)
  private parametros = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  nombre = computed(() => this.parametros().get('producto'));

  producto = computed<Producto | undefined>(() =>
    productos.find(p => p.slug === this.nombre())
  );

  // Galería: imagen principal y miniaturas (si el producto trae varias fotos)
  imagenes = computed(() => {
    const p = this.producto();
    return p ? (p.imagenes?.length ? p.imagenes : [p.imagen]) : [];
  });
  imagenElegida = signal('');
  imagenActiva = computed(() => this.imagenElegida() || this.imagenes()[0] || '');

  // Datos del producto que se envían al carrito (nombre y precio salen del producto)
  productoCarrito = computed<ProductoCarrito | null>(() => {
    const p = this.producto();
    return p ? { id: p.slug, nombre: p.nombre, precio: p.precio, imagen: p.imagen } : null;
  });

  // Promesa de entrega: la calcula Laravel (hoy, un mock del Paso 0); Angular solo muestra label y countdown_label
  promesa = this.promesas.promesa();

  // Calendario "O prográmalo para una fecha futura": dibuja solo lo que llega en `windows`.
  // La elección queda en el checkout (entrega programada) y se muestra después en el pago.
  ventanas = this.promesas.ventanas().windows;
  textoVentana = textoVentana;
  ventanaElegida = computed(() => {
    const d = this.checkout.datos();
    return d.entrega === 'programada'
      ? this.ventanas.find(v => v.available && v.start === d.ventanaInicio && v.end === d.ventanaFin)
      : undefined;
  });

  elegirVentana(v: VentanaDisponible): void {
    if (!v.available) return;
    // Tocar otra vez la ventana elegida vuelve a "lo antes posible"
    if (this.ventanaElegida() === v) this.checkout.actualizar({ entrega: 'inmediata', ventanaInicio: '', ventanaFin: '' });
    else this.checkout.actualizar({ entrega: 'programada', ventanaInicio: v.start, ventanaFin: v.end });
  }

  // "Envío desde $3,50 según destino · Lleva 2 macetas y el envío es gratis (excepto Galápagos)". Valores desde la configuración.
  lineaEnvio = computed(() => {
    const desde = `$${ENVIO_DESDE.toFixed(2).replace('.', ',')}`;
    return `Envío desde ${desde} según destino · Lleva ${this.envioGratis.MACETAS_PARA_ENVIO_GRATIS} macetas y el envío es gratis (excepto Galápagos)`;
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


  // El personalizador es la ruta hija /producto/{slug}/personalizar: la dirección dice si está abierto
  private urlActual = toSignal(
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), map(() => this.router.url)),
    { initialValue: this.router.url },
  );
  personalizadorAbierto = computed(() => this.urlActual().split(/[?#]/)[0].endsWith('/personalizar'));
  private abiertoDesdeLaFicha = false;

  constructor() {
    // Con el personalizador abierto no se desplaza la página de atrás
    effect(() => {
      if (this.esNavegador) this.document.body.style.overflow = this.personalizadorAbierto() ? 'hidden' : '';
    });

    afterNextRender(() => {
      this.checkout.restaurar();                                   // la ventana elegida en una visita anterior
      this.document.body.classList.add('con-barra-ficha');         // la barra fija de la ficha ocupa el lugar de la barra del celular
    });
  }

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
      void this.router.navigate(['/categorias']);
    }
  }

  // En celular el personalizador sube desde abajo (hoja); en pantalla media y grande es un modal.
  // El cambio de aspecto lo hace el CSS; aquí solo se bloquea el scroll de la página de atrás.
  abrirPersonalizador(): void {
    this.abiertoDesdeLaFicha = true;
    void this.router.navigate(['/producto', this.nombre(), 'personalizar']);
  }

  cerrarPersonalizador(): void {
    // Si se abrió desde la ficha, "cerrar" es volver atrás; si se entró directo a la dirección, va a la ficha
    if (this.abiertoDesdeLaFicha) {
      this.abiertoDesdeLaFicha = false;
      this.location.back();
    } else {
      void this.router.navigate(['/producto', this.nombre()], { replaceUrl: true });
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
    // El personalizador ya llevó al carrito: la dirección cambia sola y el personalizador se cierra
    console.log('Configuración guardada:', config);
    this.abiertoDesdeLaFicha = false;
    this.agregado.set(true);
  }

  ngOnDestroy(): void {
    this.document.body.style.overflow = '';
    this.document.body.classList.remove('con-barra-ficha');
  }




}