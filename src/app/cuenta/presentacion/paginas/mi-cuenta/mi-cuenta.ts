import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { Observable, finalize } from 'rxjs';
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
  private destroyRef = inject(DestroyRef);

  readonly usuario = this.sesion.usuario;
  readonly esAdministrador = this.sesion.esAdministrador;
  error = signal('');
  ocupado = signal(false);

  constructor() {
    inject(Title).setTitle('Mi cuenta | Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  cerrarSesion(): void {
    this.salir(this.sesion.cerrarSesion());
  }

  cerrarTodas(): void {
    this.salir(this.sesion.cerrarTodas());
  }

  private salir(accion: Observable<void>): void {
    this.error.set('');
    this.ocupado.set(true);
    accion.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.ocupado.set(false);
        void this.router.navigate(['/ingresar']); // el navegador ya quedó sin token aunque la API haya fallado
      }),
    ).subscribe({ error: (e: ErrorApi) => this.error.set(e.message) });
  }
}
