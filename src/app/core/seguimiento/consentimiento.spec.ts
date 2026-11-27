import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConsentimientoService } from './ConsentimientoService';
import { AvisoCookies } from '../../shared/componentes/aviso-cookies/aviso-cookies';

const gtm = () => document.head.querySelectorAll('script[src*="googletagmanager.com/gtm.js"]');

describe('Aviso de cookies y carga de GTM', () => {
  beforeEach(() => {
    localStorage.clear();
    gtm().forEach(s => s.remove());
    (window as unknown as { dataLayer?: unknown[] }).dataLayer = [];
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });
  afterEach(() => { localStorage.clear(); gtm().forEach(s => s.remove()); });

  it('sin elección previa muestra el aviso y no carga GTM', () => {
    const c = TestBed.inject(ConsentimientoService);
    c.iniciar();
    expect(c.mostrarAviso()).toBe(true);
    expect(c.marketing()).toBe(false);
    expect(gtm()).toHaveLength(0);
  });

  it('al aceptar carga GTM una sola vez con el ID de la tienda y recuerda la elección', () => {
    const c = TestBed.inject(ConsentimientoService);
    c.iniciar();
    c.aceptar();
    c.aceptar();
    expect(gtm()).toHaveLength(1);
    expect((gtm()[0] as HTMLScriptElement).src).toContain('id=GTM-5TTZST4M');
    expect(c.marketing()).toBe(true);
    expect(c.mostrarAviso()).toBe(false);
    expect(localStorage.getItem('jds_cookies')).toBe('aceptado');
    expect((window as unknown as { dataLayer: { event?: string }[] }).dataLayer.some(e => e.event === 'gtm.js')).toBe(true);
  });

  it('al rechazar no carga GTM, ni al volver a visitar', () => {
    const c = TestBed.inject(ConsentimientoService);
    c.iniciar();
    c.rechazar();
    expect(gtm()).toHaveLength(0);
    expect(c.marketing()).toBe(false);
    expect(localStorage.getItem('jds_cookies')).toBe('rechazado');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const otra = TestBed.inject(ConsentimientoService);
    otra.iniciar();
    expect(otra.mostrarAviso()).toBe(false);
    expect(gtm()).toHaveLength(0);
  });

  it('quien ya había aceptado vuelve con GTM cargado y sin aviso; «reabrir» permite cambiar', () => {
    localStorage.setItem('jds_cookies', 'aceptado');
    const c = TestBed.inject(ConsentimientoService);
    c.iniciar();
    expect(gtm()).toHaveLength(1);
    expect(c.mostrarAviso()).toBe(false);
    c.reabrir();
    expect(c.mostrarAviso()).toBe(true);
  });

  it('el aviso aparece con un solo botón, «Aceptar», y no en el panel de administración', async () => {
    const f = TestBed.createComponent(AvisoCookies);
    TestBed.inject(ConsentimientoService).iniciar();
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('Solo necesarias');
    expect(el.querySelectorAll('button')).toHaveLength(1);
    expect(el.textContent).toContain('Aceptar');

    (el.querySelector('button.primario') as HTMLButtonElement).click();
    f.detectChanges();
    expect(el.querySelector('.aviso-privacidad')).toBeNull();
  });
});
