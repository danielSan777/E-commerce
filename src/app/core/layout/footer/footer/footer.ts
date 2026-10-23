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

  // ===== TODO LO EDITABLE ESTÁ AQUÍ: textos, enlaces y rutas de imágenes =====

  // --- Marca (lado izquierdo en computador, arriba en celular) ---
  logo = 'logo.png';
  textoLogo = 'El Jardín de Sele';
  descripcion =
    'En El Jardín de Sel encontrarás los detalles más especiales para decorar tus espacios favoritos, ' +
    'además de recuerdos para regalar en fiestas y ocasiones importantes.';
  telefono = '+593 999283765';
  correo = 'info@El Jardín de Sel.com';

  // --- Columnas de enlaces ---
  columnas: ColumnaEnlaces[] = [
    {
      titulo: 'Sobre Nosotros',
      enlaces: [
        { texto: 'Inicio', ruta: '/' },
        { texto: 'Conócenos', ruta: '/conocenos' },
        { texto: 'Nuestras colecciones', ruta: '/colecciones' },
        { texto: 'Contacto', ruta: '/contacto' },
        { texto: 'Blogs de interes', ruta: '/blogs' },
        { texto: 'Preguntas frecuentes', ruta: '/preguntas-frecuentes' },
      ]
    },
    {
      titulo: 'Atención al Cliente',
      enlaces: [
        { texto: 'Políticas de Privacidad', ruta: '/politicas-privacidad' },
        { texto: 'Términos y Condiciones', ruta: '/terminos-condiciones' },
        { texto: 'Política de Reembolso', ruta: '/politica-reembolso' },
        { texto: 'Políticas de Envios', ruta: '/politicas-envios' },
        { texto: 'Zonas y costo de envio', ruta: '/zonas-envio' },
        { texto: 'Mi Cuenta', ruta: '/cuenta' },
        { texto: 'Recuperar Contraseña', ruta: '/recuperar-contrasena' },
      ]
    }
  ];

  // --- Libro de Reclamaciones ---
  libro = {
    titulo: 'Libro de Reclamaciones',
    texto:
      'De acuerdo a lo establecido en el Código de Protección y Defensa del Consumidor ' +
      'QumirDeco cuenta con un Libro de Reclamaciones a su disposición.',
    imagen: 'imagenes/footer/libro-reclamaciones.png',
    textoImagen: 'Libro de reclamaciones digital',
    enlace: '#'
  };

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
    { nombre: 'Instagram', icono: 'bi-instagram', enlace: 'https://www.instagram.com/' },
    { nombre: 'TikTok', icono: 'bi-tiktok', enlace: 'https://www.tiktok.com/' },
    { nombre: 'Facebook', icono: 'bi-facebook', enlace: 'https://www.facebook.com/' },
  ];

  // --- Parte de abajo ---
  derechos = 'El Jardín de Sele ® Realizado por';
  autor = 'Daniel Alvarado';
  mediosPago: { nombre: string; imagen: string }[] = [
    { nombre: 'Visa', imagen: 'imagenes/footer/pagos/visa.png' },
    { nombre: 'Mastercard', imagen: 'imagenes/footer/pagos/mastercard.png' },
    { nombre: 'Discover', imagen: 'imagenes/footer/pagos/discover.png' },
    { nombre: 'Western Union', imagen: 'imagenes/footer/pagos/western-union.png' },
    { nombre: 'American Express', imagen: 'imagenes/footer/pagos/amex.png' },
    { nombre: 'Express', imagen: 'imagenes/footer/pagos/express.png' },
    { nombre: 'PayPal', imagen: 'imagenes/footer/pagos/paypal.png' },
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