const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Solo da formato a fechas YYYY-MM-DD que ya vienen calculadas por Laravel (no calcula nada).
function partes(fecha: string): { d: number; m: number } {
    const [, m, d] = fecha.split('-').map(Number);
    return { d, m };
}

/** "2026-11-14" + "2026-11-16" → "Del 14 al 16 de noviembre" · si cambia el mes: "Del 30 de noviembre al 2 de diciembre" */
export function textoVentana(inicio: string, fin: string): string {
    const a = partes(inicio);
    const b = partes(fin);
    if (a.m === b.m) return `Del ${a.d} al ${b.d} de ${MESES[b.m - 1]}`;
    return `Del ${a.d} de ${MESES[a.m - 1]} al ${b.d} de ${MESES[b.m - 1]}`;
}
