import { contarCaracteres, recortarCaracteres, sinEmojis } from './texto';

describe('texto', () => {
  it('cuenta un emoji como 1 carácter', () => {
    expect(contarCaracteres('Hola 🌿')).toBe(6);
    expect(contarCaracteres('Año ñandú')).toBe(9);
  });

  it('recorta sin partir un emoji', () => {
    expect(recortarCaracteres('ab🌿cd', 3)).toBe('ab🌿');
    expect(recortarCaracteres('abc', 5)).toBe('abc');
  });

  it('quita los emojis del nombre y conserva tildes y ñ', () => {
    expect(sinEmojis('Lic. Peña 🌿❤️')).toBe('Lic. Peña ');
  });
});
