import { coincide, normalizar } from './normalizar';

describe('búsqueda: normalizar y coincidir', () => {
  it('quita tildes y mayúsculas', () => {
    expect(normalizar('  MÉDICO ')).toBe('medico');
  });

  it('"fisio" encuentra Fisioterapeuta y "medico" encuentra Médico', () => {
    expect(coincide('fisio', ['Fisioterapeuta'])).toBe(true);
    expect(coincide('medico', ['Médico'])).toBe(true);
  });

  it('coincide por inicio de palabra, no por el medio', () => {
    expect(coincide('terapeuta', ['Fisioterapeuta'])).toBe(false);
  });

  it('todas las palabras escritas deben coincidir', () => {
    expect(coincide('bob cor', ['Bob corazón Hombre'])).toBe(true);
    expect(coincide('bob doctor', ['Bob corazón Hombre'])).toBe(false);
  });

  it('un término vacío no encuentra nada', () => {
    expect(coincide('  ', ['Doctor'])).toBe(false);
  });
});
