// ===== EDITABLE: datos para las transferencias =====
// Son los valores de ejemplo del diseño. Reemplázalos por los datos reales de la tienda.

export const TITULAR_TRANSFERENCIA = {
    titular: 'Selene Tigua',
    cedula: '09XXXXXXXX',
    correo: 'pagos@jardindesele.com',
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
    { banco: 'Banco Guayaquil', tipo: 'Cuenta de ahorros', numero: '1234567890', sigla: 'BG', fondo: '#d6006f', texto: '#fff' },
    { banco: 'Banco Pichincha', tipo: 'Cuenta de ahorros', numero: '0987654321', sigla: 'BP', fondo: '#ffd200', texto: '#1a2b5f' },
    { banco: 'Banco del Pacífico', tipo: 'Cuenta de ahorros', numero: '1122334455', sigla: 'PA', fondo: '#0b6fb8', texto: '#fff' },
];

// ===== EDITABLE: tiempo de entrega que se muestra en la confirmación =====
export const ENTREGA_ESTIMADA = 'jueves a viernes';