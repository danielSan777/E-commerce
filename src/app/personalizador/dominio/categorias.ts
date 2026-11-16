/**
 * Nombre de categoría tal como lo usa el personalizador. Las categorías llegan de la base como las escribió el
 * administrador («personalizacion», «moda»…): sin tildes y a veces en minúscula. Las dos que tienen un lugar propio
 * (Moda → «Lentes / Gafas», Personalización → «Nombre») se reconocen sin importar tildes ni mayúsculas.
 */
export const CATEGORIA_MODA = 'Moda';
export const CATEGORIA_PERSONALIZACION = 'Personalización';

export function categoriaCanonica(categoria?: string): string | undefined {
  const t = categoria?.trim();
  if (!t) return t;
  const clave = t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  if (clave === 'moda') return CATEGORIA_MODA;
  if (clave === 'personalizacion') return CATEGORIA_PERSONALIZACION;
  return t.charAt(0).toUpperCase() + t.slice(1);
}
