import { DestroyRef, Directive, ElementRef, PLATFORM_ID, effect, inject, input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Video decorativo: silenciado, en bucle, `playsinline`. Se reproduce SOLO mientras está a la vista y la pestaña está visible
// (se pausa al salir de pantalla o cambiar de pestaña) y, con "reducir movimiento", no se reproduce: queda la portada o el primer cuadro.
// Un solo video a la vez: al empezar uno, los demás de la página se pausan.
@Directive({ selector: 'video[appVideoAuto]' })
export class VideoAuto {
  private static activo: HTMLVideoElement | null = null;
  /** false cuando hay varios videos seguidos: así el video termina y la tienda pasa al siguiente. */
  readonly bucle = input(true, { alias: 'appVideoAutoBucle' });

  constructor() {
    const el: HTMLVideoElement = inject(ElementRef<HTMLVideoElement>).nativeElement;
    const destroyRef = inject(DestroyRef);
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    // El navegador solo permite el autoplay si está silenciado (el atributo `muted` no siempre llega a la propiedad)
    el.muted = true;
    effect(() => { el.loop = this.bucle(); });
    el.loop = this.bucle();
    el.playsInline = true;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let visible = false;
    const actualizar = () => {
      if (visible && document.visibilityState === 'visible') {
        if (VideoAuto.activo && VideoAuto.activo !== el && !VideoAuto.activo.paused) VideoAuto.activo.pause();
        VideoAuto.activo = el;
        void el.play?.()?.catch(() => { /* el navegador puede negarlo (ahorro de datos): queda la portada */ });
      } else {
        if (!el.paused) el.pause();
        if (VideoAuto.activo === el) VideoAuto.activo = null;
      }
    };

    const observador = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entradas => {
      visible = entradas.some(e => e.isIntersecting);
      actualizar();
    }, { threshold: 0.25 });
    if (observador) observador.observe(el); else { visible = true; actualizar(); }

    document.addEventListener('visibilitychange', actualizar);
    destroyRef.onDestroy(() => {
      observador?.disconnect();
      document.removeEventListener('visibilitychange', actualizar);
      if (!el.paused) el.pause();
      if (VideoAuto.activo === el) VideoAuto.activo = null;
    });
  }
}
