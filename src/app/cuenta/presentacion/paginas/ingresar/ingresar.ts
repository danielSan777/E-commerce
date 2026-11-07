import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SesionService } from '../../../aplicacion/servicios/SesionService';
import { destinoSeguro } from '../../../aplicacion/destino';
import { ErrorApi } from '../../../dominio/interfaces/sesion';

// Ingreso único para clientes y administradores. La validación y los mensajes vienen de Laravel;
// según el rol que responde la API, el administrador va a su panel y el cliente a su cuenta.
@Component({
  selector: 'app-ingresar',
  imports: [FormsModule, RouterLink],
  templateUrl: './ingresar.html',
  styleUrl: './ingresar.css',
})
export class Ingresar {
  private sesion = inject(SesionService);
  private router = inject(Router);
  private ruta = inject(ActivatedRoute);

  email = '';
  password = '';
  enviando = signal(false);
  error = signal('');
  detalle = signal<string[]>([]);

  constructor() {
    inject(Title).setTitle('Ingresar | Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
    const usuario = this.sesion.usuario();
    if (usuario && this.sesion.estaAutenticado()) void this.router.navigateByUrl(this.destino(usuario.role));
  }

  async entrar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (this.enviando()) return;
    this.error.set('');
    this.detalle.set([]);
    this.enviando.set(true);
    try {
      await this.sesion.iniciarSesion(this.email.trim(), this.password);
      this.password = '';
      await this.router.navigateByUrl(this.destino(this.sesion.usuario()!.role));
    } catch (e) {
      const err = e as ErrorApi;
      this.error.set(err.message);
      this.detalle.set(Object.values(err.errors ?? {}).flat());
    } finally {
      this.enviando.set(false);
    }
  }

  private destino(rol: 'admin' | 'customer'): string {
    return destinoSeguro(this.ruta.snapshot.queryParamMap.get('returnUrl'), rol);
  }
}
