import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Enlace {
  texto: string;
  ruta: string;          // ruta de su aplicación, por ejemplo '/' o '/catalogo/macetas'
}

interface ColumnaEnlaces {
  titulo: string;
  enlaces: Enlace[];
}

interface RedSocial {
  nombre: string;        // para accesibilidad
  icono: string;         // clase de Bootstrap Icons: 'bi-instagram', 'bi-tiktok', 'bi-facebook', 'bi-whatsapp'...
  enlace: string;        // dirección completa de la red social
}

@Component({
  imports: [RouterLink],
  selector: 'app-footer',
  styleUrl: './footer.css',
  templateUrl: './footer.html',
})

export class Footer {


  // ===== Botón flotante de WhatsApp (editable) =====
  // Número con código de país, SOLO dígitos (sin +, espacios ni guiones). Ejemplo Ecuador: 593999283765
  numeroWhatsapp = '593999283765';

  // Mensaje que aparece escrito al abrir el chat
  mensajeWhatsapp = 'Hola, quisiera más información sobre sus productos.';

  // Texto que se ve junto al botón
  textoWhatsapp = 'Chatea con nosotros';



  // ===== TODO LO EDITABLE ESTÁ AQUÍ: textos, enlaces y rutas de imágenes =====

  // --- Marca (lado izquierdo en computador, arriba en celular) ---
  logo = 'logo_sin_fondo.png';
  textoLogo = 'Jardín de Sele';
  descripcion =
    'En Jardín de Sele encontrarás los detalles más especiales para decorar tus espacios favoritos, ' +
    'además de recuerdos para regalar en fiestas y ocasiones importantes.';
  telefono = '+593 999283765';
  correo = 'info@Jardín de Sel.com';

  // --- Columnas de enlaces ---
  // Solo van enlaces a páginas que EXISTEN. Cuando se creen las políticas, preguntas frecuentes, etc.
  // (Paso de políticas), se agregan aquí; una columna sin enlaces no se muestra.
  columnas: ColumnaEnlaces[] = [
    {
      titulo: 'Sobre Nosotros',
      enlaces: [
        { texto: 'Inicio', ruta: '/' },
      ]
    },
  ];

  // --- Boletín ---
  boletin = {
    titulo: 'Suscríbete al boletín',
    texto:
      'Al suscribirte, no solo estarás al tanto de las últimas novedades y promociones, ' +
      'sino que también desbloquearás un regalo especial.',
    placeholder: 'Introduce tu e-mail.',
    boton: 'SUSCRIBIRME',
    mensajeExito: '¡Gracias por suscribirte!',
    mensajeError: 'Escribe un correo válido.'
  };

  redes: RedSocial[] = [
    { nombre: 'Instagram', icono: 'bi-instagram', enlace: 'https://www.instagram.com/jardindesele?rpxt=b3dib204ZjdybXAx' },
    { nombre: 'TikTok', icono: 'bi-tiktok', enlace: 'https://www.tiktok.com/@jardindesele?_r=1&_t=ZS-9AoGQ9nwUCL' },
    { nombre: 'WhatsApp', icono: 'bi-whatsapp', enlace: `https://wa.me/${this.numeroWhatsapp}?text=${encodeURIComponent(this.mensajeWhatsapp)}` },
  ];

  // --- Parte de abajo ---
  derechos = 'Jardín de Sele ® Realizado por';
  autor = 'LCD. Daniel Alvarado correo:';
  correoAutor = 'adanieledinson@gmail.com';
  enlaceCorreoAutor = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(this.correoAutor)}`;
  // Solo los medios de pago reales de la tienda
  mediosPago: { nombre: string; icono: string }[] = [
    { nombre: 'Tarjeta con PayPhone', icono: 'bi-credit-card-2-front' },
    { nombre: 'Transferencia bancaria', icono: 'bi-bank2' },
  ];

  // ===== Lógica (no hace falta editar) =====

  // Sección desplegada en pantallas medianas y celular (solo una a la vez). null = todas cerradas.
  seccionAbierta = signal<number | null>(null);

  alternar(indice: number): void {
    this.seccionAbierta.update(actual => (actual === indice ? null : indice));
  }

  mensaje = signal('');
  mensajeEsError = signal(false);

  suscribir(evento: Event, campo: HTMLInputElement): void {
    evento.preventDefault();
    const valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campo.value.trim());
    this.mensajeEsError.set(!valido);
    this.mensaje.set(valido ? this.boletin.mensajeExito : this.boletin.mensajeError);
    if (valido) {
      // Aquí puede enviar el correo a su servicio (campo.value)
      campo.value = '';
    }
  }
}