// Solo conversión para el formulario: la persona escribe dólares y la API trabaja en centavos enteros.
// Sin números decimales de por medio (nada de 0.1 + 0.2): se lee el texto y se arman los centavos.

/** "21", "21.5", "21,50" → centavos. Devuelve null si no es un monto válido (negativo, letras o más de 2 decimales). */
export function dolaresACentavos(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.');
  const m = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(limpio);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0') || '0');
}

/** 2350 → "23.50" */
export function centavosADolares(centavos: number): string {
  return `${Math.floor(centavos / 100)}.${String(centavos % 100).padStart(2, '0')}`;
}
