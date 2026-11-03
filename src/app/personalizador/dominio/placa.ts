/*
 * Vista previa del nombre en la placa (regla de "Implementación acordada" del Documento Maestro).
 *
 * En producción el nombre va entre 11 y 12,5 en el software de impresión (referencia 12). La vista previa lo
 * representa igual, sin estirar nunca el texto: los nombres cortos llegan hasta el equivalente de 12,5, los
 * medianos usan 12 y los largos bajan hasta 11. Si un nombre válido no cabe ni a 11, solo se reduce la
 * representación en pantalla; nunca se bloquea el nombre. Esos valores NO son milímetros del SVG.
 */

export const PLACA_CAJA_ANCHO = 400;     // caja lógica del SVG (viewBox)
export const PLACA_CAJA_ALTO = 100;
export const PLACA_LINEA_BASE = 62;      // línea base fija
const MARGEN = 10;

// ===== EDITABLES =====
const PX_REFERENCIA_12 = 28;             // píxeles del SVG que equivalen a "12" de impresión
const MAX_NOMBRE = 30;

/** Tamaño de impresión equivalente según el largo del nombre: 12,5 (corto) · 12 (mediano) · de 12 a 11 (largo). */
export function tamanoImpresion(texto: string): number {
    const largo = [...texto].length;
    if (largo <= 10) return 12.5;
    if (largo <= 20) return 12;
    return 12 - Math.min(largo - 20, MAX_NOMBRE - 20) * 0.1;
}

/**
 * Tamaño de letra en la caja lógica del SVG.
 * @param anchoA100 ancho del texto medido con la fuente a 100 px
 */
export function tamanoLetra(texto: string, anchoA100: number): number {
    let px = PX_REFERENCIA_12 * (tamanoImpresion(texto) / 12);

    const disponible = PLACA_CAJA_ANCHO - 2 * MARGEN;
    const ancho = (anchoA100 * px) / 100;
    if (anchoA100 > 0 && ancho > disponible) px = (disponible * 100) / anchoA100;   // solo en pantalla

    return px;
}

/** Ancho aproximado a 100 px cuando todavía no se puede medir (servidor o fuente sin cargar). */
export function anchoEstimadoA100(texto: string): number {
    return [...texto].length * 50;
}
