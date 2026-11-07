import { generarSlug } from './slug';

describe('generarSlug', () => {
  it('cada espacio pasa a guion bajo, en minúsculas y sin tildes', () => {
    expect(generarSlug('Día de la Madre')).toBe('dia_de_la_madre');
    expect(generarSlug('Profesiones y Hobbies')).toBe('profesiones_y_hobbies');
    expect(generarSlug('Año Nuevo')).toBe('ano_nuevo');
  });

  it('varios espacios o signos seguidos dejan un solo guion bajo y no empieza ni termina con uno', () => {
    expect(generarSlug('  Amor   y   Pareja  ')).toBe('amor_y_pareja');
    expect(generarSlug('¡Hola, mundo!')).toBe('hola_mundo');
  });

  it('un nombre sin letras ni números queda vacío', () => {
    expect(generarSlug('!!!')).toBe('');
    expect(generarSlug('')).toBe('');
  });
});
