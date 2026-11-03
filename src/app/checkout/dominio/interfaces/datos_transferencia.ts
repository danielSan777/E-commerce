// ===== EDITABLE: datos para las transferencias (entregados por Josué) =====

export const TITULAR_TRANSFERENCIA = {
    titular: 'JOSUE DE SANTIS',
    cedula: '0930247994',
};

export interface CuentaBancaria {
    banco: string;
    tipo: string;
    numero: string;
    sigla: string;    // letras del distintivo de color (no es el logo oficial)
    fondo: string;
    texto: string;
}

export const CUENTAS: CuentaBancaria[] = [
    { banco: 'Banco Guayaquil', tipo: 'Cuenta de ahorros', numero: '17488885', sigla: 'BG', fondo: '#d6006f', texto: '#fff' },
    { banco: 'Banco Pacífico', tipo: 'Cuenta de ahorros', numero: '1051285363', sigla: 'PA', fondo: '#0b6fb8', texto: '#fff' },
    { banco: 'Banco Pichincha', tipo: 'Cuenta de ahorros', numero: '2206070147', sigla: 'BP', fondo: '#ffd200', texto: '#1a2b5f' },
];
