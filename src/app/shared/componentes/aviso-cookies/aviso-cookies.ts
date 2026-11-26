import { Component, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { ConsentimientoService } from '../../../core/seguimiento/ConsentimientoService';

// Aviso de cookies (sin la palabra «cookie» en selector, clase ni id: Brave y otros bloqueadores ocultan esos nombres): aparece abajo hasta que la persona elige. No se muestra en el panel de administración.
@Component({
  selector: 'app-aviso-privacidad',
  template: `
    @if (consentimiento.mostrarAviso() && !esAdmin()) {
      <section class="aviso-privacidad" role="dialog" aria-labelledby="titulo-privacidad" aria-live="polite">
        <div class="texto">
          <strong id="titulo-privacidad">Cookies</strong>
          <p>Usamos cookies para medir las visitas y mostrarte anuncios que te interesen. Puedes aceptarlas o usar solo las necesarias para comprar.</p>
        </div>
        <div class="botones">
          <button type="button" class="secundario" (click)="consentimiento.rechazar()">Solo necesarias</button>
          <button type="button" class="primario" (click)="consentimiento.aceptar()">Aceptar</button>
        </div>
      </section>
    }
  `,
  styles: `
    .aviso-privacidad { position: fixed; left: 50%; bottom: 1rem; transform: translateX(-50%); width: min(94vw, 46rem); z-index: 1900; display: flex; flex-wrap: wrap; align-items: center; gap: .75rem 1.25rem; padding: 1rem 1.25rem; border-radius: 14px; background: #fff; color: #1f2937; box-shadow: 0 10px 32px rgba(0,0,0,.28); border: 1px solid #d1d5db; }
    .texto { flex: 1 1 18rem; }
    .texto p { margin: .25rem 0 0; font-size: .92rem; line-height: 1.35; }
    .botones { display: flex; gap: .5rem; flex: none; }
    button { min-height: 44px; padding: 0 1.1rem; border-radius: 10px; font-weight: 600; cursor: pointer; border: 1px solid #1b5e20; }
    .primario { background: #1b5e20; color: #fff; }
    .secundario { background: #fff; color: #1b5e20; }
    @media (max-width: 520px) { .botones { width: 100%; } .botones button { flex: 1; } }
  `,
})
export class AvisoCookies {
  readonly consentimiento = inject(ConsentimientoService);
  private router = inject(Router);
  /** Ruta actual; el panel de administración nunca muestra el aviso. */
  private ruta = toSignal(this.router.events.pipe(filter(e => e instanceof NavigationEnd), map(e => (e as NavigationEnd).urlAfterRedirects)), { initialValue: this.router.url });
  esAdmin = () => this.ruta().startsWith('/admin');
}
