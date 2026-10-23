import { Component } from '@angular/core';

interface ItemInformacion {
  imagen: string;       // ruta de la imagen pequeña (icono)
  titulo: string;
  descripcion: string;
}

@Component({
  imports: [],
  selector: 'app-informacion',
  styleUrl: './informacion.css',
  templateUrl: './informacion.html',
})

export class Informacion {

  // Los 4 bloques (cambie las rutas de las imágenes, los títulos y las descripciones)
  items: ItemInformacion[] = [
    {
      imagen: 'imagenes/informacion/envios.png',
      titulo: 'Envíos a domicilio',
      descripcion: 'En caso tengas alguna duda con el distrito de envío comuníquese con nosotros para poder asesorarlo.'
    },
    {
      imagen: 'imagenes/informacion/atencion.png',
      titulo: 'Atención al cliente',
      descripcion: 'Queremos ser parte de los momentos mas especiales de tu vida y ayudarte a transmitir emociones con el regalo perfecto.'
    },
    {
      imagen: 'imagenes/informacion/pagos.png',
      titulo: 'Pagos seguros',
      descripcion: 'Pensando en tu comodidad y lo valioso de tu tiempo hemos simplificado la manera de realizar tus pagos.'
    },
    {
      imagen: 'imagenes/informacion/atencion-24-7.png',
      titulo: 'Atención 24/7',
      descripcion: 'Apoyamos a nuestros clientes las 24 horas del día, los 7 días de la semana, enviamos preguntas y lo resolveremos por usted de inmediato.'
    }
  ];
}