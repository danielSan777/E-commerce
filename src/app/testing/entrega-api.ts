import { Promesa, VentanaDisponible } from '../checkout/dominio/interfaces/promesa';

// Lo que responde Laravel en /delivery/promise y /delivery/windows (lunes 9 de noviembre de 2026, 16:18 en Guayaquil).
export const PROMESA_API: Promesa = {
    server_now: '2026-11-09T21:18:00Z',
    cycle_date: '2026-11-09',
    cutoff_at: '2026-11-10T01:00:00Z',
    dispatch_date: '2026-11-11',
    window: { start: '2026-11-12', end: '2026-11-13' },
    label: 'Recíbelo entre jueves 12 y viernes 13 de noviembre',
    countdown_label: 'Pídelo en las próximas 3 h 42 min',
    promise_token: 'firmado-por-laravel',
    amazon_note: 'Región Amazónica: considera 1 día adicional.',
};

export const VENTANAS_API: VentanaDisponible[] = [
    { start: '2026-11-12', end: '2026-11-13', available: true },
    { start: '2026-11-14', end: '2026-11-16', available: true },
    { start: '2026-11-17', end: '2026-11-18', available: false },
    { start: '2026-11-19', end: '2026-11-20', available: true },
    { start: '2026-11-21', end: '2026-11-23', available: true },
];
