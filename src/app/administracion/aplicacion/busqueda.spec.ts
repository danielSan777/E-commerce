import { coincide, normalizar } from './busqueda';

describe('búsqueda por nombre', () => {
  it('ignora mayúsculas, tildes y espacios de los extremos', () => {
    expect(normalizar('  Camión ')).toBe('camion');
    expect(coincide('Caja de Herramienta', 'HERRAM')).toBe(true);
    expect(coincide('Corazón', 'corazon')).toBe(true);
    expect(coincide('Balanza', 'cora')).toBe(false);
  });

  it('un texto vacío coincide con todo', () => {
    expect(coincide('Balanza', '')).toBe(true);
    expect(coincide('Balanza', '   ')).toBe(true);
  });
});
