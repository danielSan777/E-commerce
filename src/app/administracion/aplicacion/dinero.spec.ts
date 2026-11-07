import { centavosADolares, dolaresACentavos } from './dinero';

describe('dinero', () => {
  it('convierte dólares escritos a centavos enteros sin errores de decimales', () => {
    expect(dolaresACentavos('21')).toBe(2100);
    expect(dolaresACentavos('21.5')).toBe(2150);
    expect(dolaresACentavos('21,50')).toBe(2150);
    expect(dolaresACentavos(' 0.07 ')).toBe(7);
    expect(dolaresACentavos('19.99')).toBe(1999);
    expect(dolaresACentavos('1.10')).toBe(110);
  });

  it('rechaza montos inválidos', () => {
    for (const malo of ['', 'abc', '-5', '1.234', '1..2', '$5', '12 34', '99999999']) expect(dolaresACentavos(malo)).toBeNull();
  });

  it('muestra centavos como dólares con dos decimales', () => {
    expect(centavosADolares(2350)).toBe('23.50');
    expect(centavosADolares(7)).toBe('0.07');
    expect(centavosADolares(2100)).toBe('21.00');
  });

  it('ida y vuelta', () => {
    for (const c of [0, 1, 99, 100, 1999, 2200, 1234567]) expect(dolaresACentavos(centavosADolares(c))).toBe(c);
  });
});
