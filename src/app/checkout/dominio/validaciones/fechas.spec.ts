import { textoVentana } from './fechas';

describe('textoVentana', () => {
    it('misma fecha de mes: "Del 14 al 16 de noviembre"', () => {
        expect(textoVentana('2026-11-14', '2026-11-16')).toBe('Del 14 al 16 de noviembre');
    });

    it('cambia el mes: lo nombra dos veces', () => {
        expect(textoVentana('2026-11-30', '2026-12-02')).toBe('Del 30 de noviembre al 2 de diciembre');
    });
});
