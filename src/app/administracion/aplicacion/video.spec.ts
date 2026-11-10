import { LIMITES_VIDEO, textoLimite, validarVideo } from './video';

const mp4 = (mb: number) => ({ type: 'video/mp4', size: mb * 1024 * 1024 });

describe('validarVideo', () => {
  it('todo video (producto, banner de categoría y portada de inicio) dura hasta un minuto, con un cuarto de segundo de tolerancia', () => {
    for (const l of [LIMITES_VIDEO.products, LIMITES_VIDEO.categories, LIMITES_VIDEO.inicio]) {
      expect(validarVideo(mp4(1), 60.2, l)).toBe('');
      expect(validarVideo(mp4(1), 60, l)).toBe('');
      expect(validarVideo(mp4(1), 61, l)).toContain('un minuto');
    }
    expect(textoLimite(LIMITES_VIDEO.inicio)).toBe('un minuto');
    expect(validarVideo(mp4(1), 75, LIMITES_VIDEO.products)).toContain('dura 75 s');
    expect(textoLimite(LIMITES_VIDEO.products)).toBe('un minuto');
  });

  it('rechaza lo que no es MP4 y lo que pesa de más', () => {
    expect(validarVideo({ type: 'video/quicktime', size: 1000 }, 3, LIMITES_VIDEO.products)).toContain('MP4');
    expect(validarVideo({ type: 'image/png', size: 1000 }, null, LIMITES_VIDEO.products)).toContain('MP4');
    expect(validarVideo(mp4(16), 3, LIMITES_VIDEO.products)).toContain('menos de 15 MB');
    expect(validarVideo(mp4(16), 30, LIMITES_VIDEO.categories)).toContain('menos de 15 MB');
  });

  it('si el navegador no pudo leer la duración, deja que decida Laravel', () => {
    expect(validarVideo(mp4(1), null, LIMITES_VIDEO.products)).toBe('');
  });
});
