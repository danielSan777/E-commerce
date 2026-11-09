import { Component, inject } from '@angular/core';
import { AvisosService } from './AvisosService';

@Component({
  selector: 'app-avisos',
  template: `
    <div class="avisos" aria-live="polite">
      @for (a of avisos.lista(); track a.id) {
        <div class="aviso-flotante" [class.error]="a.tipo === 'error'" [attr.role]="a.tipo === 'error' ? 'alert' : 'status'">
          <span class="icono" aria-hidden="true">{{ a.tipo === 'error' ? '!' : '✓' }}</span>
          <span class="texto">{{ a.texto }}</span>
          <button type="button" class="cerrar" aria-label="Cerrar aviso" (click)="avisos.cerrar(a.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: `
    .avisos { position: fixed; top: 1rem; left: 50%; transform: translateX(-50%); width: min(92vw, 28rem); z-index: 2000; display: grid; gap: .5rem; pointer-events: none; }
    .aviso-flotante { pointer-events: auto; display: flex; align-items: center; gap: .75rem; padding: .85rem 1rem; border-radius: 12px; background: #1b5e20; color: #fff; box-shadow: 0 8px 24px rgba(0,0,0,.25); animation: entrar .2s ease-out; }
    .aviso-flotante.error { background: #8a1c13; }
    .icono { display: grid; place-items: center; flex: none; width: 1.6rem; height: 1.6rem; border-radius: 50%; background: rgba(255,255,255,.2); font-weight: 700; }
    .texto { flex: 1; font-size: 1rem; line-height: 1.3; }
    .cerrar { flex: none; background: none; border: 0; color: inherit; font-size: 1.5rem; line-height: 1; cursor: pointer; padding: 0 .25rem; }
    @keyframes entrar { from { opacity: 0; transform: translateY(-.5rem); } to { opacity: 1; transform: none; } }
    @media (prefers-reduced-motion: reduce) { .aviso-flotante { animation: none; } }
  `,
})
export class Avisos {
  readonly avisos = inject(AvisosService);
}
