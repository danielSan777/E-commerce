import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SesionService } from '../../../aplicacion/servicios/SesionService';
import { destinoSeguro } from '../../../aplicacion/destino';
import { Errores, validarIngreso } from '../../../aplicacion/validacion';
import { ErrorApi } from '../../../dominio/interfaces/sesion';
import { finalize, from } from 'rxjs';

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
  private destroyRef = inject(DestroyRef);

  email = '';
  password = '';
  enviando = signal(false);
  error = signal('');
  detalle = signal<string[]>([]);
  /** Errores por campo (vacío, formato) detectados en el navegador antes de llamar a la API. */
  errores = signal<Errores>({});

  constructor() {
    inject(Title).setTitle('Ingresar | Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
    const usuario = this.sesion.usuario();
    if (usuario && this.sesion.estaAutenticado()) void this.router.navigateByUrl(this.destino(usuario.role));
  }

  entrar(evento: Event): void {
    evento.preventDefault();
    if (this.enviando()) return;
    this.error.set('');
    this.detalle.set([]);
    const errores = validarIngreso(this.email, this.password);
    this.errores.set(errores);
    if (Object.keys(errores).length) return; // campos vacíos o inválidos: no se llama a la API
    this.enviando.set(true);
    this.sesion.iniciarSesion(this.email.trim(), this.password).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.password = '';
        this.abrirPantalla();
      },
      error: (e: Partial<ErrorApi>) => {
        this.error.set(e.message || 'No pudimos iniciar sesión. Inténtalo de nuevo.');
        this.detalle.set(Object.values(e.errors ?? {}).flat());
        this.enviando.set(false);
      },
    });
  }

  /** `false` = alguna guarda bloqueó la navegación: no se deja al usuario sin respuesta. */
  private abrirPantalla(): void {
    const fallo = 'Ingresaste, pero no pudimos abrir la pantalla. Recarga la página e inténtalo de nuevo.';
    from(this.router.navigateByUrl(this.destino(this.sesion.usuario()!.role))).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.enviando.set(false)),
    ).subscribe({
      next: abierta => { if (!abierta) this.error.set(fallo); },
      error: () => this.error.set(fallo),
    });
  }

  private destino(rol: 'admin' | 'customer'): string {
    return destinoSeguro(this.ruta.snapshot.queryParamMap.get('returnUrl'), rol);
  }
}
