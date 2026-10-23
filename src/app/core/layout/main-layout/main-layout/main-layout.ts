import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../../navbar/navbar/navbar';
import { Footer } from '../../footer/footer/footer';


@Component({
  imports: [RouterOutlet, Navbar, Footer],
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
}