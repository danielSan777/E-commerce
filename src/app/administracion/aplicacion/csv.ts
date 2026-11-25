/**
 * Texto CSV para Excel en español: columnas separadas por «;» (el separador de lista de Excel en Ecuador), comillas dobles
 * escapadas, saltos de línea CRLF y marca BOM para que se vean bien las tildes y la ñ. Un texto que empieza con =, +, - o @
 * se antecede con una comilla simple para que Excel no lo ejecute como fórmula.
 */
export function aCsv(filas: string[][]): string {
  const celda = (valor: string): string => {
    const seguro = /^[=+\-@]/.test(valor) && !/^-?\d+([.,]\d+)?$/.test(valor) ? `'${valor}` : valor;
    return /[";\r\n]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
  };
  return '﻿' + filas.map(f => f.map(celda).join(';')).join('\r\n') + '\r\n';
}

/** Descarga un texto como archivo desde el navegador. */
export function descargarTexto(nombre: string, texto: string, tipo = 'text/csv;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([texto], { type: tipo }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
