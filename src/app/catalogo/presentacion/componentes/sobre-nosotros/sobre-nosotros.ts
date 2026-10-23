import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-sobre-nosotros',
  styleUrl: './sobre-nosotros.css',
  templateUrl: './sobre-nosotros.html',
})

export class SobreNosotros {

  // ===== TODO LO EDITABLE ESTÁ AQUÍ: cambie los textos y las rutas de las imágenes =====

  // Imagen grande de fondo
  imagenFondo = 'imagenes/sobreNosotros/sobre_nosotros.png';

  // Imagen pequeña de la empresa (logo) que va arriba del nombre en el cuadro blanco
  logo = 'logo.png';
  textoLogo = 'Logo de la empresa';

  // Nombre de la empresa. Si ya tiene el nombre dentro de la imagen del logo, deje esto vacío ('')
  nombreEmpresa = 'El Jardín de Sele';

  // Título pequeño, en mayúsculas, debajo del nombre
  titulo = 'OBSEQUIOS LLENOS DE VIDA Y AMOR';

  // Descripción
  descripcion =
    'Nuestra pasión por la naturaleza, hizo que emprendieramos El Jardín de Sele brindandote calidad en nuestros regalos ' +
    'ayudando un poquito a que te unas a este lindo mundo que te hará encontrar con lo ecosexual que llevas dentro.';

  // Botón
  textoBoton = 'SOBRE NOSOTROS';
  enlaceBoton = '#'; // a dónde lleva el botón (por ahora no lleva a ninguna parte)
}