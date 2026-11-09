import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, from, switchMap, tap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SesionService } from '../../../aplicacion/servicios/SesionService';
import { destinoSeguro } from '../../../aplicacion/destino';
import { Errores, validarRegistro } from '../../../aplicacion/validacion';
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
  private destroyRef = inject(DestroyRef);

  name = '';
  email = '';
  password = '';
  confirmacion = '';
  enviando = signal(false);
  error = signal('');
  detalle = signal<string[]>([]);
  /** Errores por campo detectados en el navegador antes de llamar a la API. */
  errores = signal<Errores>({});

  constructor() {
    inject(Title).setTitle('Crear cuenta | Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  crear(evento: Event): void {
    evento.preventDefault();
    if (this.enviando()) return;
    this.error.set('');
    this.detalle.set([]);
    const errores = validarRegistro({ name: this.name, email: this.email, password: this.password, confirmacion: this.confirmacion });
    this.errores.set(errores);
    if (Object.keys(errores).length) return; // campos vacíos o inválidos: no se llama a la API
    this.enviando.set(true);
    this.sesion.crearCuenta({
      name: this.name.trim(),
      email: this.email.trim(),
      password: this.password,
      password_confirmation: this.confirmacion,
    }).pipe(
      tap(() => this.password = this.confirmacion = ''),
      switchMap(() => from(this.router.navigateByUrl(destinoSeguro(this.ruta.snapshot.queryParamMap.get('returnUrl'), this.sesion.usuario()!.role)))),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.enviando.set(false)),
    ).subscribe({
      next: abierta => {
        if (!abierta) this.error.set('Tu cuenta se creó, pero no pudimos abrir la pantalla. Recarga la página e ingresa.');
      },
      error: (e: Partial<ErrorApi>) => {
        this.error.set(e.message || 'No pudimos crear la cuenta. Inténtalo de nuevo.');
        this.detalle.set(Object.values(e.errors ?? {}).flat());
      },
    });
  }
}
