// El mensaje del comprobante lo arma Laravel (incluye el enlace /pedido/{token}); aquí solo quedan formatos de texto.
const MESES = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];

export function dinero(valor: number): string {
    return `$${valor.toFixed(2)}`;
}

/** "18 de mar. 2025 a las 16:32" */
export function fechaLarga(iso: string): string {
    const d = new Date(iso);
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${d.getDate()} de ${MESES[d.getMonth()]} ${d.getFullYear()} a las ${hora}:${min}`;
}
