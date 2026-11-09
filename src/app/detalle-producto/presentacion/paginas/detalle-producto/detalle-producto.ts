import { Component, OnDestroy, PLATFORM_ID, afterNextRender, computed, effect, inject, signal, untracked } from '@angular/core';
import { VideoAuto } from '../../../../shared/directivas/video-auto';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, RouterLink } from '@angular/router';
import { catchError, filter, map, of, switchMap, tap } from 'rxjs';
import { ProductoFicha } from '../../../dominio/interfaces/producto-ficha';
import { ProductoService } from '../../../aplicacion/servicios/ProductoService';
import { IMAGEN_PENDIENTE } from '../../../../categorias/aplicacion/servicios/CategoriaService';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { Personalizador } from '../../../../personalizador/presentacion/paginas/personalizador/personalizador';
import { PromesaService } from '../../../../checkout/aplicacion/servicios/PromesaService';
import { CheckoutService } from '../../../../checkout/aplicacion/servicios/CheckoutService';
import { VentanaDisponible } from '../../../../checkout/dominio/interfaces/promesa';
import { textoVentana } from '../../../../checkout/dominio/validaciones/fechas';
import { ENVIO_DESDE } from '../../../../checkout/dominio/validaciones/envio';
import { EnvioGratisService } from '../../../../catalogo/aplicacion/servicios/EnvioGratisService';
import { CalendarioVentanas } from '../../../../shared/componentes/calendario-ventanas/calendario-ventanas';
import { AnalyticsService } from '../../../../core/seguimiento/AnalyticsService';
import { NoEncontrada } from '../../../../core/paginas/no-encontrada/no-encontrada';
import { ProductoCarrito } from '../../../../carrito/aplicacion/servicios/CarritoService';

@Component({
  imports: [RouterLink, Personalizador, NoEncontrada, CalendarioVentanas, VideoAuto],
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
  private analytics = inject(AnalyticsService);
  private envioGratis = inject(EnvioGratisService);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));
  // ====== EDITABLE ======
  moneda = '$.';
  codigoMoneda = 'USD';
  rutaListado = 'todos-productos';
  textoListado = 'Productos';

  // =======================
  private productosApi = inject(ProductoService);
  private titulo = inject(Title);
  private meta = inject(Meta);
  private router = inject(Router);
  // Nombre del producto que viene en la ruta (ej: /productos/Abogada)
  private parametros = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  nombre = computed(() => this.parametros().get('producto'));

  /** true si la API no respondió (distinto de "no existe": eso es un 404). */
  fallo = signal(false);

  /** undefined = cargando · null = no existe · ficha = lo que Laravel entregó. */
  producto = toSignal<ProductoFicha | null | undefined>(
    toObservable(this.nombre).pipe(
      tap(() => this.fallo.set(false)),
      switchMap(slug => slug ? this.productosApi.producto(slug).pipe(
        catchError(() => { this.fallo.set(true); return of(null); }),
      ) : of(null)),
    ),
    { initialValue: undefined },
  );

  // Galería: las fotos del producto (la principal primero, en tamaño grande); sin fotos, una imagen provisional
  imagenes = computed(() => {
    const p = this.producto();
    if (!p) return [];
    const fotos = p.media.filter(m => m.type === 'image').map(m => m.srcset?.['1080'] ?? Object.values(m.srcset ?? {}).pop()).filter((u): u is string => !!u);
    return fotos.length ? fotos : [IMAGEN_PENDIENTE];
  });
  // Video del producto (máx. 6 s): una lámina más de la galería, al final. Solo se carga y se reproduce cuando está activa.
  video = computed(() => { const m = this.producto()?.media.find(x => x.type === 'video' && !!x.url); return m ? { url: m.url!, poster: m.poster ?? this.imagenes()[0] } : null; });
  verVideo = signal(false);
  imagenElegida = signal('');
  imagenActiva = computed(() => this.imagenElegida() || this.imagenes()[0] || '');

  // Datos del producto que se envían al carrito (nombre y precio salen del producto)
  productoCarrito = computed<ProductoCarrito | null>(() => {
    const p = this.producto();
    return p ? { id: p.slug, nombre: p.name, precio: p.price.final_cents / 100, imagen: this.imagenes()[0] } : null;
  });

  // Promesa de entrega: la calcula Laravel (hoy, un mock del Paso 0); Angular solo muestra label y countdown_label
  promesa = this.promesas.promesa();

  // Calendario "O prográmalo para una fecha futura": dibuja solo lo que llega en `windows`.
  // La elección queda en el checkout (entrega programada) y se muestra después en el pago.
  ventanas = this.promesas.ventanas().windows;
  textoVentana = textoVentana;
  // El calendario se abre solo con el botón (o ya abierto si hay una fecha programada)
  calendarioAbierto = signal(this.checkout.datos().entrega === 'programada');

  ventanaElegida = computed(() => {
    const d = this.checkout.datos();
    return d.entrega === 'programada'
      ? this.ventanas.find(v => v.available && v.start === d.ventanaInicio && v.end === d.ventanaFin)
      : undefined;
  });

  elegirVentana(v: VentanaDisponible): void {
    if (!v.available) return;
    this.analytics.track('select_delivery_window', { start: v.start, end: v.end });
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
  enlaceTwitter = computed(() => `https://twitter.com/intent/tweet?url=${encodeURIComponent(this.enlace())}&text=${encodeURIComponent(this.producto()?.name ?? '')}`);
  enlacePinterest = computed(() => `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(this.enlace())}&description=${encodeURIComponent(this.producto()?.name ?? '')}`);


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

    // Una vez por producto: título, descripción y vista previa para Google y WhatsApp (los textos los entrega Laravel)
    effect(() => {
      const p = this.producto();
      if (!p) return;
      this.titulo.setTitle(p.seo.title ?? `${p.name} | Jardín de Sele`);
      const descripcion = p.seo.description ?? p.description_html ?? '';
      this.meta.updateTag({ name: 'description', content: descripcion });
      this.meta.updateTag({ property: 'og:title', content: p.seo.title ?? p.name });
      this.meta.updateTag({ property: 'og:description', content: descripcion });
      if (p.seo.og_image) this.meta.updateTag({ property: 'og:image', content: p.seo.og_image });
      this.meta.updateTag({ property: 'og:url', content: p.seo.canonical });
      let enlace = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!enlace) {
        enlace = this.document.createElement('link');
        enlace.rel = 'canonical';
        this.document.head.appendChild(enlace);
      }
      enlace.href = p.seo.canonical;
    });

    // La vista del producto se mide solo en el navegador, cuando la ficha ya llegó
    effect(() => {
      const p = this.producto();
      if (p && this.esNavegador) untracked(() => this.analytics.track('view_item', { items: [{ item_id: p.slug, item_name: p.name }] }));
    });

    afterNextRender(() => {
      this.checkout.restaurar();                                   // la ventana elegida en una visita anterior
      this.document.body.classList.add('con-barra-ficha');         // la barra fija de la ficha ocupa el lugar de la barra del celular
    });
  }

  /** Muestra en dólares los centavos que entrega Laravel (solo formato: el cálculo es de Laravel). */
  formato(centavos: number) {
    return `${this.moneda} ${(centavos / 100).toFixed(2)}`;
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
    this.analytics.track('start_customization', { item_id: this.producto()?.slug });
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