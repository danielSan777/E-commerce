import { debeRecargar, esFalloDeCarga } from './pantallaDesactualizada';

describe('pantallaDesactualizada', () => {
  it('reconoce el fallo de bajar una pantalla que cambió con una publicación nueva', () => {
    expect(esFalloDeCarga(new TypeError('Failed to fetch dynamically imported module: https://jardindesele.com/chunk-ABC.js'))).toBe(true);
    expect(esFalloDeCarga(new Error('error loading dynamically imported module'))).toBe(true);
    expect(esFalloDeCarga(new TypeError('Importing a module script failed.'))).toBe(true);
    expect(esFalloDeCarga({ message: 'Loading chunk 12 failed.' })).toBe(true);
  });

  it('no confunde otros errores de navegación con ese fallo', () => {
    expect(esFalloDeCarga(new Error('Cannot match any routes. URL Segment: x'))).toBe(false);
    expect(esFalloDeCarga(new TypeError("Cannot read properties of undefined (reading 'a')"))).toBe(false);
    expect(esFalloDeCarga(null)).toBe(false);
    expect(esFalloDeCarga(undefined)).toBe(false);
  });

  it('recarga la primera vez y no vuelve a hacerlo dentro de 15 segundos (evita un ciclo)', () => {
    expect(debeRecargar(100_000, null)).toBe(true);
    expect(debeRecargar(100_000, 90_000)).toBe(false);
    expect(debeRecargar(100_000, 84_999)).toBe(true);
  });
});
