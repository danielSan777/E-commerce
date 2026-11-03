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

/**
 * "Paga antes del martes 10 de noviembre, 07:50" (hora de Guayaquil).
 * SOLO la usa el mock: con backend, `deadline_label` llega ya escrito desde Laravel y Angular no formatea el plazo.
 */
export function etiquetaLimite(iso: string): string {
    const partes = new Intl.DateTimeFormat('es-EC', {
        timeZone: 'America/Guayaquil', weekday: 'long', day: 'numeric', month: 'long',
        hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date(iso));

    const dato = (tipo: string) => partes.find(p => p.type === tipo)?.value ?? '';
    return `Paga antes del ${dato('weekday')} ${dato('day')} de ${dato('month')}, ${dato('hour')}:${dato('minute')}`;
}
