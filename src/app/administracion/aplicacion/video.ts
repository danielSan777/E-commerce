import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// Revisión rápida de un video ANTES de subirlo, para no hacer una petición de balde. Es solo comodidad:
// la validación real (formato MP4, H.264, duración y peso) la hace Laravel leyendo el archivo.
// Los límites repiten los de Laravel (ProcesadorDeVideos): todo video dura 1 minuto como máximo.

export interface LimiteVideo { segundos: number; bytes: number; nombre: string }

export const LIMITES_VIDEO: Record<'products' | 'categories' | 'inicio', LimiteVideo> = {
  products: { segundos: 60, bytes: 100 * 1024 * 1024, nombre: 'del producto' },
  categories: { segundos: 60, bytes: 100 * 1024 * 1024, nombre: 'del banner de la categoría' },
  inicio: { segundos: 60, bytes: 100 * 1024 * 1024, nombre: 'de la página principal' },
};

/** Un video de "1 minuto" suele medir 60,02 s: se tolera un cuarto de segundo, igual que Laravel. */
export const TOLERANCIA_S = 0.25;

export function textoLimite(l: LimiteVideo): string {
  return l.segundos >= 60 ? 'un minuto' : `${l.segundos} segundos`;
}

function mb(bytes: number): string {
  return (bytes / 1048576).toLocaleString('es', { maximumFractionDigits: 1 });
}

/** Devuelve el motivo del rechazo, o '' si el video puede subirse. `duracion` null = el navegador no pudo leerla (se deja a Laravel). */
export function validarVideo(archivo: { type: string; size: number }, duracion: number | null, limite: LimiteVideo): string {
  if (archivo.type !== 'video/mp4') return 'Elige un video en formato MP4 (H.264).';
  if (archivo.size > limite.bytes) return `El video ${limite.nombre} debe pesar menos de ${mb(limite.bytes)} MB. Exporta uno más liviano.`;
  if (duracion !== null && duracion > limite.segundos + TOLERANCIA_S) {
    return `El video ${limite.nombre} puede durar como máximo ${textoLimite(limite)} y el tuyo dura ${Math.round(duracion)} s. Recórtalo y súbelo de nuevo.`;
  }
  return '';
}

/** Dirección temporal para mostrar un archivo elegido antes de subirlo. Vacía si el navegador no puede crearla. Hay que liberarla con `liberarVista`. */
export function crearVista(archivo: File): string {
  return typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(archivo) : '';
}

export function liberarVista(url: string): void {
  if (url && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url);
}

/** Lee la duración (en segundos) con el propio navegador; emite null si no puede leerla (por ejemplo, un códec que no reconoce). */
export function leerDuracion(archivo: File): Observable<number | null> {
  return new Observable<number | null>(suscriptor => {
    const url = URL.createObjectURL(archivo);
    const video = document.createElement('video');
    const terminar = (d: number | null) => { suscriptor.next(d); suscriptor.complete(); };
    video.preload = 'metadata';
    video.onloadedmetadata = () => terminar(Number.isFinite(video.duration) ? video.duration : null);
    video.onerror = () => terminar(null);
    video.src = url;
    return () => { video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); };
  });
}

/** Lector de la duración, como servicio para poder reemplazarlo en las pruebas (el navegador de pruebas no lee videos). */
@Injectable({ providedIn: 'root' })
export class LectorDeVideo {
  duracion(archivo: File): Observable<number | null> {
    return leerDuracion(archivo);
  }
}
