import { PromesaService } from './PromesaService';

// El mock debe tener la forma EXACTA del contrato del Paso 0
describe('PromesaService (mock del Paso 0)', () => {
    const servicio = new PromesaService();

    it('la promesa trae todos los campos del contrato y ninguno más', () => {
        expect(Object.keys(servicio.promesa()).sort()).toEqual([
            'amazon_note', 'countdown_label', 'cutoff_at', 'cycle_date', 'dispatch_date',
            'label', 'promise_token', 'server_now', 'window',
        ]);
        expect(servicio.promesa().window).toEqual({ start: '2026-11-12', end: '2026-11-13' });
        expect(servicio.promesa().label).toBe('Recíbelo entre jueves 12 y viernes 13 de noviembre');
    });

    it('las ventanas traen start, end y available; la del 17 de noviembre no está disponible', () => {
        const { windows } = servicio.ventanas();

        for (const v of windows) expect(Object.keys(v).sort()).toEqual(['available', 'end', 'start']);
        expect(windows.slice(0, 3)).toEqual([
            { start: '2026-11-12', end: '2026-11-13', available: true },
            { start: '2026-11-14', end: '2026-11-16', available: true },
            { start: '2026-11-17', end: '2026-11-18', available: false },
        ]);
    });

    it('cada ventana son 2 días válidos: sin domingos, y el sábado se une con el lunes', () => {
        const { windows } = servicio.ventanas();

        for (const v of windows) {
            expect(new Date(v.start + 'T00:00:00Z').getUTCDay()).not.toBe(0);
            expect(new Date(v.end + 'T00:00:00Z').getUTCDay()).not.toBe(0);
        }
        expect(windows.find(v => v.start === '2026-11-21')?.end).toBe('2026-11-23');   // sábado + lunes
    });

    it('las ventanas no se cruzan y el 25 de diciembre no entra', () => {
        const { windows } = servicio.ventanas();
        const dias = windows.flatMap(v => [v.start, v.end]);

        expect(new Set(dias).size).toBe(dias.length);
        expect(dias).not.toContain('2026-12-25');
    });
});
