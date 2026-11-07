import { Component, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { SesionService } from '../../../aplicacion/servicios/SesionService';
import { ErrorApi } from '../../../dominio/interfaces/sesion';

// Cuenta del cliente. Por ahora muestra sus datos y permite cerrar sesión; sus pedidos se agregan con el módulo de Pedidos.
@Component({
  selector: 'app-mi-cuenta',
  imports: [RouterLink],
  templateUrl: './mi-cuenta.html',
  styleUrl: './mi-cuenta.css',
})
export class MiCuenta {
  private sesion = inject(SesionService);
  private router = inject(Router);

  readonly usuario = this.sesion.usuario;
  readonly esAdministrador = this.sesion.esAdministrador;
  error = signal('');
  ocupado = signal(false);

  constructor() {
    inject(Title).setTitle('Mi cuenta | Jardín de Sele');
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
