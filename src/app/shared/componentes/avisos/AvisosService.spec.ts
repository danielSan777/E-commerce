import { TestBed } from '@angular/core/testing';
import { AvisosService } from './AvisosService';

describe('AvisosService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('muestra el aviso y lo quita solo al pasar el tiempo', () => {
    const s = TestBed.inject(AvisosService);
    s.exito('Imagen subida.');
    expect(s.lista().map(a => a.texto)).toEqual(['Imagen subida.']);
    vi.advanceTimersByTime(4500);
    expect(s.lista()).toEqual([]);
  });

  it('el mismo mensaje dos veces seguidas se muestra las dos veces', () => {
    const s = TestBed.inject(AvisosService);
    s.exito('Cambios guardados.');
    s.exito('Cambios guardados.');
    expect(s.lista().length).toBe(2);
  });

  it('muestra como máximo 3 y se pueden cerrar a mano; los de error duran más', () => {
    const s = TestBed.inject(AvisosService);
    ['a', 'b', 'c', 'd'].forEach(t => s.exito(t));
    expect(s.lista().map(a => a.texto)).toEqual(['b', 'c', 'd']);
    s.cerrar(s.lista()[0].id);
    expect(s.lista().length).toBe(2);

    s.error('fallo');
    vi.advanceTimersByTime(5000);
    expect(s.lista().map(a => a.texto)).toEqual(['fallo']);
    vi.advanceTimersByTime(3000);
    expect(s.lista()).toEqual([]);
  });

  it('faltanDatos muestra el aviso general y lleva al primer campo marcado en rojo', () => {
    const s = TestBed.inject(AvisosService);
    const campo = document.createElement('input');
    campo.setAttribute('aria-invalid', 'true');
    document.body.appendChild(campo);

    s.faltanDatos();
    vi.advanceTimersByTime(0);

    expect(s.lista().at(-1)).toMatchObject({ tipo: 'error', texto: 'Faltan datos o hay datos incorrectos. Revisa los campos marcados en rojo.' });
    expect(document.activeElement).toBe(campo);
    campo.remove();
  });
});
