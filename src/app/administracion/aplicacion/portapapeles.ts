/** Copia el texto al portapapeles, con respaldo para navegadores sin permiso. Devuelve si se pudo. */
export async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = texto;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let copiado = false;
    try { copiado = document.execCommand('copy'); } catch { /* sin permiso */ }
    area.remove();
    return copiado;
  }
}
