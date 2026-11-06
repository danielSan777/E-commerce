import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { SesionAdminService } from '../../../aplicacion/servicios/SesionAdminService';
import { ErrorApi } from '../../../dominio/interfaces/sesion';

/** Solo se vuelve a rutas internas del panel (evita redirecciones a otros sitios). */
export function destinoSeguro(returnUrl: string | null): string {
  return returnUrl && /^\/admin(\/|$|\?)/.test(returnUrl) && !returnUrl.startsWith('/admin/login') ? returnUrl : '/admin';
}

// Login del administrador. La validación y los mensajes vienen de Laravel; aquí solo se muestran.
@Component({
  selector: 'app-admin-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class AdminLogin {
  private sesion = inject(SesionAdminService);
  private router = inject(Router);
  private ruta = inject(ActivatedRoute);

  email = '';
  password = '';
  enviando = signal(false);
  error = signal('');
  detalle = signal<string[]>([]);

  constructor() {
    inject(Title).setTitle('Ingreso | Panel de Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
    if (this.sesion.estaAutenticado()) void this.router.navigateByUrl(this.destino());
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
      await this.router.navigateByUrl(this.destino());
    } catch (e) {
      const err = e as ErrorApi;
      this.error.set(err.message);
      this.detalle.set(Object.values(err.errors ?? {}).flat());
    } finally {
      this.enviando.set(false);
    }
  }

  private destino(): string {
    return destinoSeguro(this.ruta.snapshot.queryParamMap.get('returnUrl'));
  }
}
