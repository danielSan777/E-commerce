import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SesionService } from '../../../aplicacion/servicios/SesionService';
import { destinoSeguro } from '../../../aplicacion/destino';
import { ErrorApi } from '../../../dominio/interfaces/sesion';

// Crear cuenta de cliente. Laravel valida y devuelve los mensajes en español; la cuenta siempre nace como cliente.
@Component({
  selector: 'app-crear-cuenta',
  imports: [FormsModule, RouterLink],
  templateUrl: './crear-cuenta.html',
  styleUrl: './crear-cuenta.css',
})
export class CrearCuenta {
  private sesion = inject(SesionService);
  private router = inject(Router);
  private ruta = inject(ActivatedRoute);

  name = '';
  email = '';
  password = '';
  confirmacion = '';
  enviando = signal(false);
  error = signal('');
  detalle = signal<string[]>([]);

  constructor() {
    inject(Title).setTitle('Crear cuenta | Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  async crear(evento: Event): Promise<void> {
    evento.preventDefault();
    if (this.enviando()) return;
    this.error.set('');
    this.detalle.set([]);
    this.enviando.set(true);
    try {
      await this.sesion.crearCuenta({
        name: this.name.trim(),
        email: this.email.trim(),
        password: this.password,
        password_confirmation: this.confirmacion,
      });
      this.password = this.confirmacion = '';
      await this.router.navigateByUrl(destinoSeguro(this.ruta.snapshot.queryParamMap.get('returnUrl'), this.sesion.usuario()!.role));
    } catch (e) {
      const err = e as ErrorApi;
      this.error.set(err.message);
      this.detalle.set(Object.values(err.errors ?? {}).flat());
    } finally {
      this.enviando.set(false);
    }
  }
}
