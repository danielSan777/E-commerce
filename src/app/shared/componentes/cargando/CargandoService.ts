import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Cuenta las consultas a la API que están en curso y decide cuándo mostrar la pantalla de carga.
 * - Espera 200 ms antes de mostrarla: si la API responde rápido, no aparece (evita el parpadeo).
 * - Una vez visible, se queda al menos 600 ms: así la animación no se corta de golpe.
 */
@Injectable({ providedIn: 'root' })
export class CargandoService {
  static readonly ESPERA_MS = 200;
  static readonly MINIMO_MS = 600;

  private navegador = isPlatformBrowser(inject(PLATFORM_ID));
  private pendientes = 0;
  private temporizadorMostrar: ReturnType<typeof setTimeout> | null = null;
  private temporizadorOcultar: ReturnType<typeof setTimeout> | null = null;
  private visibleDesde = 0;
  private _visible = signal(false);
  readonly visible = computed(() => this._visible());

  /** Empieza una consulta. */
  iniciar(): void {
    if (!this.navegador) return;
    this.pendientes++;
    if (this.temporizadorOcultar) { clearTimeout(this.temporizadorOcultar); this.temporizadorOcultar = null; }
    if (this.pendientes === 1 && !this._visible() && !this.temporizadorMostrar) {
      this.temporizadorMostrar = setTimeout(() => {
        this.temporizadorMostrar = null;
        if (this.pendientes > 0) { this.visibleDesde = Date.now(); this._visible.set(true); }
      }, CargandoService.ESPERA_MS);
    }
  }

  /** Termina una consulta (con éxito o con error). */
  terminar(): void {
    if (!this.navegador || this.pendientes === 0) return;
    this.pendientes--;
    if (this.pendientes > 0) return;
    if (this.temporizadorMostrar) { clearTimeout(this.temporizadorMostrar); this.temporizadorMostrar = null; }
    if (!this._visible()) return;
    const falta = Math.max(0, CargandoService.MINIMO_MS - (Date.now() - this.visibleDesde));
    this.temporizadorOcultar = setTimeout(() => { this.temporizadorOcultar = null; if (this.pendientes === 0) this._visible.set(false); }, falta);
  }
}
