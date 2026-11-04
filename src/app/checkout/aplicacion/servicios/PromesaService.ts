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

    // Ventanas de 2 días de entrega válidos seguidos, sin domingos ni feriados (un sábado se junta con el lunes).
    // MOCK: aquí las arma el servicio; con backend las calcula Laravel y Angular solo las dibuja.
    ventanas(): VentanasDisponibles {
        const FERIADOS = ['2026-12-25', '2027-01-01'];
        const NO_DISPONIBLES = ['2026-11-17'];          // ventanas llenas (ejemplo)
        const SEMANAS = 8;

        const texto = (d: Date) => d.toISOString().slice(0, 10);
        const valido = (d: Date) => d.getUTCDay() !== 0 && !FERIADOS.includes(texto(d));

        const windows: VentanasDisponibles['windows'] = [];
        const dia = new Date('2026-11-12T00:00:00Z');
        const fin = new Date(dia.getTime() + SEMANAS * 7 * 86400_000);

        while (dia < fin) {
            while (!valido(dia)) dia.setUTCDate(dia.getUTCDate() + 1);
            const start = texto(dia);
            dia.setUTCDate(dia.getUTCDate() + 1);
            while (!valido(dia)) dia.setUTCDate(dia.getUTCDate() + 1);
            const end = texto(dia);
            dia.setUTCDate(dia.getUTCDate() + 1);
            windows.push({ start, end, available: !NO_DISPONIBLES.includes(start) });
        }

        return { windows };
    }
}
