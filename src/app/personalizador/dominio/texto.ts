// Conteo de caracteres como los ve el comprador: un emoji cuenta como 1 (no como 2 del UTF-16).
const segmentador = typeof Intl !== 'undefined' && 'Segmenter' in Intl
  ? new Intl.Segmenter('es', { granularity: 'grapheme' })
  : null;

function partes(texto: string): string[] {
  return segmentador ? Array.from(segmentador.segment(texto), s => s.segment) : Array.from(texto);
}

export function contarCaracteres(texto: string): number {
  return partes(texto).length;
}

export function recortarCaracteres(texto: string, maximo: number): string {
  const p = partes(texto);
  return p.length <= maximo ? texto : p.slice(0, maximo).join('');
}

// El nombre de la placa no admite emojis
export function sinEmojis(texto: string): string {
  return texto.replace(/[\p{Extended_Pictographic}‍️⃣]/gu, '');
}
