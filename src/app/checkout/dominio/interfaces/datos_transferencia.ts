// Las cuentas para transferir las edita Josué y llegan desde Laravel (ajuste `bank_accounts`).
// Aquí solo queda el distintivo de color de cada banco (no es el logo oficial).

export interface DistintivoBanco {
    sigla: string;    // letras del distintivo
    fondo: string;
    texto: string;
}

const DISTINTIVOS: Record<string, DistintivoBanco> = {
    'banco guayaquil': { sigla: 'BG', fondo: '#d6006f', texto: '#fff' },
    'banco pacifico': { sigla: 'PA', fondo: '#0b6fb8', texto: '#fff' },
    'banco pichincha': { sigla: 'BP', fondo: '#ffd200', texto: '#1a2b5f' },
};

/** Distintivo del banco; si es uno nuevo, sus iniciales sobre el verde de la tienda. */
export function distintivoBanco(banco: string): DistintivoBanco {
    const clave = banco.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    const conocido = DISTINTIVOS[clave];
    if (conocido) return conocido;

    const iniciales = banco.split(/\s+/).filter(p => p.length > 2).map(p => p[0].toUpperCase()).join('').slice(0, 2);
    return { sigla: iniciales || 'B', fondo: '#2f6b4f', texto: '#fff' };
}
