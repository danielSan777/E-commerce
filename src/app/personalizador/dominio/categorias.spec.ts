import { CATEGORIA_MODA, CATEGORIA_PERSONALIZACION, categoriaCanonica } from './categorias';

describe('categoriaCanonica', () => {
  it('reconoce Personalización y Moda sin importar tildes ni mayúsculas', () => {
    expect(categoriaCanonica('personalizacion')).toBe(CATEGORIA_PERSONALIZACION);
    expect(categoriaCanonica(' Personalización ')).toBe(CATEGORIA_PERSONALIZACION);
    expect(categoriaCanonica('PERSONALIZACION')).toBe(CATEGORIA_PERSONALIZACION);
    expect(categoriaCanonica('moda')).toBe(CATEGORIA_MODA);
  });

  it('a las demás les pone la primera letra en mayúscula y deja vacío lo vacío', () => {
    expect(categoriaCanonica('objetos')).toBe('Objetos');
    expect(categoriaCanonica('animales')).toBe('Animales');
    expect(categoriaCanonica(undefined)).toBeUndefined();
    expect(categoriaCanonica('  ')).toBe('');
  });
});
