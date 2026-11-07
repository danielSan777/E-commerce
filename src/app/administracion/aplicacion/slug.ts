/**
 * Vista previa del identificador de la dirección (slug) de una categoría: minúsculas, sin tildes y cada espacio
 * (o signo) como "_". Laravel genera el definitivo con la misma regla; esto solo lo muestra mientras se escribe.
 */
export function generarSlug(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes y diéresis (á → a, ñ → n)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
