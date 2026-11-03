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

    it('las ventanas traen start, end y available; la última no está disponible', () => {
        const { windows } = servicio.ventanas();

        expect(windows).toHaveLength(3);
        for (const v of windows) expect(Object.keys(v).sort()).toEqual(['available', 'end', 'start']);
        expect(windows.map(v => v.available)).toEqual([true, true, false]);
    });
});
