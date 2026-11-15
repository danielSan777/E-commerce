/** Texto en minúsculas y sin tildes, para buscar «camion» y encontrar «Camión». */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

/** true si el nombre contiene lo escrito (vacío = todo coincide). */
export function coincide(nombre: string, buscado: string): boolean {
  const b = normalizar(buscado);
  return b === '' || normalizar(nombre).includes(b);
}
