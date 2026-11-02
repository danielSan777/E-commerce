// Validaciones del formulario de envío y facturación (sin dependencias).

/** Quita tildes y pasa a minúsculas, para que "guayaquil", "Guayaquil" y "guáyaquil" se busquen igual. */
export function normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function soloDigitos(texto: string): string {
    return texto.replace(/\D/g, '');
}

function provinciaValida(codigo: number): boolean {
    return (codigo >= 1 && codigo <= 24) || codigo === 30; // 30 = ecuatorianos registrados en el exterior
}

/** Cédula ecuatoriana: 10 dígitos, provincia válida, tercer dígito menor a 6 y dígito verificador (módulo 10). */
export function cedulaValida(valor: string): boolean {
    if (!/^\d{10}$/.test(valor)) return false;
    if (!provinciaValida(Number(valor.slice(0, 2)))) return false;
    if (Number(valor[2]) > 5) return false;

    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    for (let i = 0; i < 9; i++) {
        let producto = Number(valor[i]) * coeficientes[i];
        if (producto >= 10) producto -= 9;
        suma += producto;
    }

    const verificador = (10 - (suma % 10)) % 10;
    return verificador === Number(valor[9]);
}

/** RUC: 13 dígitos terminados en 001. Persona natural = cédula + 001; 6 = entidad pública; 9 = sociedad. */
export function rucValido(valor: string): boolean {
    if (!/^\d{13}$/.test(valor) || !valor.endsWith('001')) return false;
    if (!provinciaValida(Number(valor.slice(0, 2)))) return false;
    const tercero = Number(valor[2]);
    return tercero === 6 || tercero === 9 || cedulaValida(valor.slice(0, 10));
}

/** Documento según el tipo elegido en facturación. */
export function documentoValido(tipo: 'cedula' | 'ruc', valor: string): boolean {
    return tipo === 'ruc' ? rucValido(valor) : cedulaValida(valor);
}

/** Para facturar: cédula (10 dígitos) o RUC (13 dígitos terminados en 001). */
export function documentoFacturaValido(valor: string): boolean {
    if (/^\d{10}$/.test(valor)) return cedulaValida(valor);

    if (/^\d{13}$/.test(valor) && valor.endsWith('001')) {
        if (!provinciaValida(Number(valor.slice(0, 2)))) return false;
        const tercero = Number(valor[2]);
        // 6 = entidad pública, 9 = sociedad (no llevan el mismo verificador que una persona)
        return tercero === 6 || tercero === 9 || cedulaValida(valor.slice(0, 10));
    }

    return false;
}

export function correoValido(valor: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());
}

/** Ecuador (+593): celular de 9 dígitos que empieza con 9 (se acepta con el 0 inicial: 099 123 4567). Otros países: 6 a 14 dígitos. */
export function telefonoValido(numero: string, prefijo: string): boolean {
    let digitos = soloDigitos(numero);

    if (prefijo === '+593') {
        if (digitos.startsWith('0')) digitos = digitos.slice(1);
        return /^9\d{8}$/.test(digitos);
    }

    return digitos.length >= 6 && digitos.length <= 14;
}