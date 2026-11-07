import { Component, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { SesionService } from '../../../../cuenta/aplicacion/servicios/SesionService';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';

// Pantalla inicial del panel. Las secciones (categorías, productos…) se agregan aquí a medida que existan sus APIs.
@Component({
  selector: 'app-admin-panel',
  imports: [RouterLink],
  templateUrl: './panel.html',
  styleUrl: './panel.css',
})
export class AdminPanel {
  private sesion = inject(SesionService);
  private router = inject(Router);

  readonly usuario = this.sesion.usuario;
  error = signal('');
  ocupado = signal(false);

  constructor() {
    inject(Title).setTitle('Panel | Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  cerrarSesion(): Promise<void> {
    return this.salir(() => this.sesion.cerrarSesion());
  }

  cerrarTodas(): Promise<void> {
    return this.salir(() => this.sesion.cerrarTodas());
  }

  private async salir(accion: () => Promise<void>): Promise<void> {
    this.error.set('');
    this.ocupado.set(true);
    try {
      await accion();
    } catch (e) {
      this.error.set((e as ErrorApi).message);
    } finally {
      this.ocupado.set(false);
      await this.router.navigate(['/ingresar']); // el navegador ya quedó sin token aunque la API haya fallado
    }
  }
}
