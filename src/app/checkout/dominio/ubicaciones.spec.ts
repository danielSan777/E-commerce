import { PROVINCIAS, buscarCanton, buscarProvincia, nombresDeCantones, nombresDeProvincias } from './ubicaciones';

describe('provincias y cantones del INEC (2026)', () => {
    it('trae las 24 provincias, con Guayas código 09', () => {
        expect(PROVINCIAS.length).toBe(24);
        expect(buscarProvincia('Guayas')?.codigo).toBe('09');
    });

    it('Durán aparece como cantón de Guayas (0907) y Guayaquil es 0901', () => {
        expect(nombresDeCantones('Guayas')).toContain('Durán');
        expect(buscarCanton('Guayas', 'Durán')?.codigo).toBe('0907');
        expect(buscarCanton('Guayas', 'Guayaquil')?.codigo).toBe('0901');
    });

    it('no incluye las zonas en estudio (código 90)', () => {
        expect(PROVINCIAS.some(p => p.codigo === '90')).toBe(false);
        expect(nombresDeProvincias()).not.toContain('Zonas en estudio');
    });

    it('los códigos de cantón empiezan con el código de su provincia y no se repiten', () => {
        const todos = PROVINCIAS.flatMap(p => p.cantones);

        for (const p of PROVINCIAS) {
            expect(p.cantones.every(c => c.codigo.startsWith(p.codigo))).toBe(true);
        }
        expect(new Set(todos.map(c => c.codigo)).size).toBe(todos.length);
    });

    it('una provincia desconocida no tiene cantones (nunca texto libre)', () => {
        expect(nombresDeCantones('Narnia')).toEqual([]);
    });
});
