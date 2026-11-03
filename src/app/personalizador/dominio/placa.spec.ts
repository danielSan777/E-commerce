import { PLACA_CAJA_ANCHO, tamanoImpresion, tamanoLetra } from './placa';

describe('nombre en la placa', () => {
    it('los nombres cortos usan 12,5; los medianos 12; los largos bajan hasta 11', () => {
        expect(tamanoImpresion('Ana')).toBe(12.5);
        expect(tamanoImpresion('Dra. Valeria')).toBe(12);
        expect(tamanoImpresion('a'.repeat(30))).toBeCloseTo(11);
        expect(tamanoImpresion('a'.repeat(25))).toBeCloseTo(11.5);
    });

    it('cuenta cada emoji o letra una sola vez', () => {
        expect(tamanoImpresion('🌿'.repeat(10))).toBe(12.5);
    });

    it('un nombre de 30 caracteres nunca se bloquea: si no cabe, solo se reduce en pantalla', () => {
        const letra = tamanoLetra('a'.repeat(30), 30 * 80);   // fuente muy ancha

        expect(letra).toBeGreaterThan(0);
        expect((30 * 80 * letra) / 100).toBeLessThanOrEqual(PLACA_CAJA_ANCHO);
    });

    it('un nombre que cabe conserva su tamaño de referencia (no se estira para llenar)', () => {
        expect(tamanoLetra('Ana', 150)).toBeCloseTo(28 * (12.5 / 12));
    });
});
