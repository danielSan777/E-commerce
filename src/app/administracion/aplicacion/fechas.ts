const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** "2026-12-25" → "viernes 25 de diciembre de 2026" (solo formato: la fecha ya es la de Guayaquil). */
export function fechaLarga(fecha: string): string {
  const [a, m, d] = fecha.split('-').map(Number);
  return `${DIAS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()]} ${d} de ${MESES[m - 1]} de ${a}`;
}

/** "2026-12-25" → "viernes 25 de diciembre" (sin el año). */
export function fechaCorta(fecha: string): string {
  return fechaLarga(fecha).replace(/ de \d{4}$/, '');
}

/** Un instante UTC (ISO 8601) como día y hora de Guayaquil, por ejemplo "9 nov, 20:00". Solo formato. */
export function instanteEnGuayaquil(iso: string): string {
  return new Intl.DateTimeFormat('es-EC', { timeZone: 'America/Guayaquil', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
}
