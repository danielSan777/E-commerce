import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { VideoAuto } from './video-auto';

@Component({ imports: [VideoAuto], template: `<video appVideoAuto src="x.mp4"></video><video appVideoAuto src="y.mp4"></video>` })
class Anfitrion {}

describe('VideoAuto', () => {
  type Observador = { cb: IntersectionObserverCallback; el: Element[] };
  const observadores: Observador[] = [];
  let reproducidos: HTMLVideoElement[];
  let pausados: HTMLVideoElement[];

  beforeEach(() => {
    observadores.length = 0;
    reproducidos = [];
    pausados = [];
    vi.stubGlobal('IntersectionObserver', class {
      o: Observador;
      constructor(cb: IntersectionObserverCallback) { this.o = { cb, el: [] }; observadores.push(this.o); }
      observe(el: Element) { this.o.el.push(el); }
      disconnect() { /* nada */ }
    });
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLVideoElement) { reproducidos.push(this); Object.defineProperty(this, 'paused', { value: false, configurable: true }); return Promise.resolve(); });
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (this: HTMLVideoElement) { pausados.push(this); Object.defineProperty(this, 'paused', { value: true, configurable: true }); });
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q }));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  const montar = () => {
    const f = TestBed.createComponent(Anfitrion);
    f.detectChanges();
    return f.nativeElement.querySelectorAll('video') as NodeListOf<HTMLVideoElement>;
  };
  const ver = (i: number, visible: boolean) => observadores[i].cb([{ isIntersecting: visible } as IntersectionObserverEntry], {} as IntersectionObserver);

  it('queda silenciado, en bucle y sin sonido (condición del autoplay en celulares)', () => {
    const [v] = Array.from(montar());
    expect(v.muted).toBe(true);
    expect(v.loop).toBe(true);
    expect(v.playsInline).toBe(true);
  });

  it('solo se reproduce cuando está a la vista y se pausa al salir', () => {
    const [v] = Array.from(montar());
    expect(reproducidos).toEqual([]); // fuera de pantalla: no empieza
    ver(0, true);
    expect(reproducidos).toEqual([v]);
    ver(0, false);
    expect(pausados).toContain(v);
  });

  it('un solo video a la vez: al empezar uno se pausa el otro', () => {
    const [a, b] = Array.from(montar());
    ver(0, true);
    ver(1, true);
    expect(reproducidos).toEqual([a, b]);
    expect(pausados).toContain(a);
  });

  it('con la pestaña oculta se pausa', () => {
    const [v] = Array.from(montar());
    ver(0, true);
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(pausados).toContain(v);
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  it('con "reducir movimiento" no se reproduce nunca', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: true, media: q }));
    montar();
    expect(observadores.length).toBe(0);
    expect(reproducidos).toEqual([]);
  });
});
