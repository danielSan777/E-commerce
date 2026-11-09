import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { Observable, finalize } from 'rxjs';
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
  private destroyRef = inject(DestroyRef);

  readonly usuario = this.sesion.usuario;
  error = signal('');
  ocupado = signal(false);

  constructor() {
    inject(Title).setTitle('Panel | Jardín de Sele');
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
