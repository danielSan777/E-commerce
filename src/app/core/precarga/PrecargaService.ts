import { Injectable, NgZone, inject } from '@angular/core';
import { CategoriaService } from '../../categorias/aplicacion/servicios/CategoriaService';
import { PortadaInicioService } from '../../inicio/aplicacion/servicios/PortadaInicioService';

/**
 * Al entrar a la tienda, cuando el navegador está libre, adelanta en segundo plano lo que se va a necesitar enseguida:
 * las categorías con sus productos, el encabezado de /categorias y las fotos de las tarjetas. Así, al tocar "Categorías" o
 * cambiar de categoría, todo ya está listo. No muestra la pantalla de carga y se omite con "ahorro de datos" o conexión lenta.
 * (Las pantallas de la tienda se descargan aparte, con la precarga de rutas de Angular.)
 */
@Injectable({ providedIn: 'root' })
export class PrecargaService {
  private categorias = inject(CategoriaService);
  private portada = inject(PortadaInicioService);
  private zona = inject(NgZone);
  private hecho = false;

  iniciar(): void {
    if (this.hecho || !this.permitida()) return;
    this.hecho = true;
    this.cuandoEsteLibre(() => {
      this.portada.encabezadoCategorias(true).subscribe();
      this.categorias.categorias(true).subscribe({
        next: lista => {
          lista.forEach(c => {
            this.categorias.categoria(c.slug, null, true).subscribe({ error: () => undefined });
            const foto = new Image();
            foto.src = c.image;
          });
        },
        error: () => undefined,
      });
    });
  }

  /** No gasta datos de quien activó el ahorro de datos o tiene conexión lenta. */
  private permitida(): boolean {
    const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    return !(c?.saveData || /(^|-)2g$/.test(c?.effectiveType ?? ''));
  }

  private cuandoEsteLibre(tarea: () => void): void {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    this.zona.runOutsideAngular(() => {
      if (w.requestIdleCallback) w.requestIdleCallback(() => this.zona.run(tarea), { timeout: 3000 });
      else setTimeout(() => this.zona.run(tarea), 1500);
    });
  }
}
