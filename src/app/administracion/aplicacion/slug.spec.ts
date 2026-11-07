import { generarSlug } from './slug';

describe('generarSlug', () => {
  it('cada espacio pasa a guion, en minúsculas y sin tildes', () => {
    expect(generarSlug('Día de la Madre')).toBe('dia-de-la-madre');
    expect(generarSlug('Profesiones y Hobbies')).toBe('profesiones-y-hobbies');
    expect(generarSlug('Año Nuevo')).toBe('ano-nuevo');
  });

  it('varios espacios o signos seguidos dejan un solo guion y no empieza ni termina con uno', () => {
    expect(generarSlug('  Amor   y   Pareja  ')).toBe('amor-y-pareja');
    expect(generarSlug('¡Hola, mundo!')).toBe('hola-mundo');
  });

  it('un nombre sin letras ni números queda vacío', () => {
    expect(generarSlug('!!!')).toBe('');
    expect(generarSlug('')).toBe('');
  });
});
