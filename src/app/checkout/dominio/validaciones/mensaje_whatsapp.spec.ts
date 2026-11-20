import { dinero, fechaLarga } from './mensaje_whatsapp';

describe('formatos de texto del pedido', () => {
    it('dinero siempre lleva dos decimales', () => {
        expect(dinero(28.5)).toBe('$28.50');
        expect(dinero(3)).toBe('$3.00');
    });

    it('fechaLarga escribe día, mes abreviado, año y hora', () => {
        expect(fechaLarga(new Date(2026, 10, 3, 9, 5).toISOString())).toBe('3 de nov. 2026 a las 09:05');
    });
});
