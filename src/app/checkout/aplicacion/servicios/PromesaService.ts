import { Injectable } from '@angular/core';
import { Promesa, VentanasDisponibles } from '../../dominio/interfaces/promesa';

// MOCK (Paso 0): devuelve exactamente la forma que entregará Laravel (docs/documento-maestro.md, "Promesa de entrega"
// y "Ventanas disponibles"). Cuando exista el backend, solo cambia el cuerpo de estos dos métodos por la llamada a la API;
// los componentes no se tocan.
@Injectable({ providedIn: 'root' })
export class PromesaService {

    promesa(): Promesa {
        return {
            server_now: '2026-11-09T21:18:00Z',
            cycle_date: '2026-11-09',
            cutoff_at: '2026-11-10T01:00:00Z',
            dispatch_date: '2026-11-11',
            window: { start: '2026-11-12', end: '2026-11-13' },
            label: 'Recíbelo entre jueves 12 y viernes 13 de noviembre',
            countdown_label: 'Pídelo en las próximas 3 h 42 min',
            promise_token: 'firmado-por-laravel',
            amazon_note: 'Amazonía y zonas alejadas: considera 1 día adicional.',
        };
    }

    ventanas(): VentanasDisponibles {
        return {
            windows: [
                { start: '2026-11-12', end: '2026-11-13', available: true },
                { start: '2026-11-14', end: '2026-11-16', available: true },
                { start: '2026-11-17', end: '2026-11-18', available: false },
            ],
        };
    }
}
