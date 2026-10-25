import { Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Navbar } from '../../navbar/navbar/navbar';
import { Footer } from '../../footer/footer/footer';


@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Navbar, Footer],
  selector: 'app-main-layout',
  styleUrl: './main-layout.css',
  templateUrl: './main-layout.html',
})

export class MainLayout {

  // ===== Botón flotante de WhatsApp (editable) =====
  // Número con código de país, SOLO dígitos (sin +, espacios ni guiones). Ejemplo Ecuador: 593999283765
  numeroWhatsapp = '593999283765';

  // Mensaje que aparece escrito al abrir el chat
  mensajeWhatsapp = 'Hola, quisiera más información sobre sus productos.';

  // Texto que se ve junto al botón
  textoWhatsapp = 'Chatea con nosotros';

  // Dirección final del chat
  get enlaceWhatsapp(): string {
    return `https://wa.me/${this.numeroWhatsapp}?text=${encodeURIComponent(this.mensajeWhatsapp)}`;
  }

  // ===== Botón flotante "subir arriba" =====
  private readonly distanciaParaMostrar = 300; // píxeles de scroll a partir de los cuales aparece el botón

  mostrarSubir = signal(false);   // true cuando ya bajó lo suficiente
  progreso = signal(0);           // 0 a 100: cuánto de la página ha recorrido (llena el círculo)

  // Se ejecuta cada vez que la persona hace scroll
  @HostListener('window:scroll')
  alHacerScroll(): void {
    const posicion = window.scrollY;
    const recorridoTotal = document.documentElement.scrollHeight - window.innerHeight;

    this.mostrarSubir.set(posicion > this.distanciaParaMostrar);
    this.mostrarBarraMovil.set(posicion > this.distanciaBarraMovil);
    this.progreso.set(recorridoTotal > 0 ? Math.min(100, (posicion / recorridoTotal) * 100) : 0);
  }

  // ===== Barra de opciones inferior (solo celulares) =====
  // Aparece cuando se baja más de este número de píxeles (después de la primera sección).
  // Ponga 0 si quiere que se vea siempre.
  private readonly distanciaBarraMovil = 450;

  mostrarBarraMovil = signal(false);

  // Cantidad que se ve en la burbuja del carrito
  cantidadCarrito = signal(0);

  // Opciones de la barra (cambie textos, iconos de Bootstrap Icons y rutas)
  opcionesMovil = [
    { texto: 'Inicio', icono: 'bi-house-door', ruta: '/' },
    { texto: 'Cuenta', icono: 'bi-person', ruta: '/cuenta' },
    { texto: 'Tienda', icono: 'bi-shop', ruta: '/productos' },
    { texto: 'Carrito', icono: 'bi-cart3', ruta: '/carrito' },
  ];

  // Sube hasta la primera sección (inicio de la página), con animación suave
  subirArriba(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }



}