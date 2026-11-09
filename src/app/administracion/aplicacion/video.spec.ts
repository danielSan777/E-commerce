import { LIMITES_VIDEO, textoLimite, validarVideo } from './video';

const mp4 = (mb: number) => ({ type: 'video/mp4', size: mb * 1024 * 1024 });

describe('validarVideo', () => {
  it('producto: acepta hasta 6 s (con un cuarto de segundo de tolerancia) y rechaza más', () => {
    expect(validarVideo(mp4(1), 6, LIMITES_VIDEO.products)).toBe('');
    expect(validarVideo(mp4(1), 6.2, LIMITES_VIDEO.products)).toBe('');
    expect(validarVideo(mp4(1), 6.5, LIMITES_VIDEO.products)).toContain('máximo 6 segundos');
    expect(validarVideo(mp4(1), 15, LIMITES_VIDEO.products)).toContain('dura 15 s');
  });

  it('banner de categoría y portada de inicio: hasta un minuto', () => {
    for (const l of [LIMITES_VIDEO.categories, LIMITES_VIDEO.inicio]) {
      expect(validarVideo(mp4(1), 60, l)).toBe('');
      expect(validarVideo(mp4(1), 61, l)).toContain('un minuto');
    }
    expect(textoLimite(LIMITES_VIDEO.inicio)).toBe('un minuto');
    expect(textoLimite(LIMITES_VIDEO.products)).toBe('6 segundos');
  });

  it('rechaza lo que no es MP4 y lo que pesa de más', () => {
    expect(validarVideo({ type: 'video/quicktime', size: 1000 }, 3, LIMITES_VIDEO.products)).toContain('MP4');
    expect(validarVideo({ type: 'image/png', size: 1000 }, null, LIMITES_VIDEO.products)).toContain('MP4');
    expect(validarVideo(mp4(3), 3, LIMITES_VIDEO.products)).toContain('menos de 2 MB');
    expect(validarVideo(mp4(16), 30, LIMITES_VIDEO.categories)).toContain('menos de 15 MB');
  });

  it('si el navegador no pudo leer la duración, deja que decida Laravel', () => {
    expect(validarVideo(mp4(1), null, LIMITES_VIDEO.products)).toBe('');
  });
});
