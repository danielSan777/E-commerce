import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationError } from '@angular/router';

const CLAVE = 'pantalla-recargada-en';
const ESPERA_MS = 15_000;

/** ¿El error es que el navegador no pudo bajar la pantalla (su archivo ya cambió con una publicación nueva)? */
export function esFalloDeCarga(error: unknown): boolean {
  const texto = String((error as { message?: string } | null)?.message ?? error ?? '');
  return /dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError|error loading dynamically imported/i.test(texto);
}

/** Recarga una vez, salvo que ya se haya recargado hace poco (así una pantalla realmente rota no entra en un ciclo). */
export function debeRecargar(ahora: number, ultima: number | null): boolean {
  return ultima === null || ahora - ultima > ESPERA_MS;
}

/**
 * Cuando se publica una versión nueva, la pestaña que ya estaba abierta conserva la lista vieja de archivos: al tocar un enlace
 * a una pantalla cuyo archivo cambió, la navegación falla en silencio y el botón "no hace nada" hasta refrescar.
 * Este manejador detecta ese fallo y abre la dirección pedida cargando la web de nuevo, con los archivos nuevos.
 */
export function recargarSiLaPantallaCambio(evento: NavigationError): void {
  // El router llama a este manejador dentro de un contexto de inyección
  if (!isPlatformBrowser(inject(PLATFORM_ID)) || !esFalloDeCarga(evento.error)) return;
  let ultima: number | null = null;
  try { ultima = Number(sessionStorage.getItem(CLAVE)) || null; } catch { /* sin almacenamiento: se recarga igual una vez */ }
  if (!debeRecargar(Date.now(), ultima)) return;
  try { sessionStorage.setItem(CLAVE, String(Date.now())); } catch { /* nada */ }
  window.location.assign(evento.url);
}
