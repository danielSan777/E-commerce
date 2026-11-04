// Sin tildes ni mayúsculas ni símbolos: "Médico" → "medico"
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

function palabras(texto: string): string[] {
  return normalizar(texto).split(/[^a-z0-9ñ]+/).filter(Boolean);
}

// Coincidencia por inicio de palabra: "fisio" encuentra "Fisioterapeuta"; cada palabra escrita debe iniciar alguna del texto
export function coincide(termino: string, textos: string[]): boolean {
  const buscadas = palabras(termino);
  if (!buscadas.length) return false;
  const disponibles = textos.flatMap(palabras);
  return buscadas.every(b => disponibles.some(d => d.startsWith(b)));
}
