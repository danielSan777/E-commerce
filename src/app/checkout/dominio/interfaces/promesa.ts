// Contratos del Paso 0: promesa de entrega y ventanas disponibles.
// Los nombres van en inglés y en snake_case porque son idénticos a la respuesta de Laravel.
// Angular NO calcula fechas: solo muestra label, window y countdown_label.

export interface VentanaEntrega {
    start: string;   // YYYY-MM-DD (Guayaquil)
    end: string;
}

export interface Promesa {
    server_now: string;       // ISO 8601 UTC
    cycle_date: string;
    cutoff_at: string;
    dispatch_date: string;
    window: VentanaEntrega;
    label: string;            // "Recíbelo entre jueves 12 y viernes 13 de noviembre"
    countdown_label: string;  // "Pídelo en las próximas 3 h 42 min"
    promise_token: string;    // firmado por Laravel; se envía al crear el pedido
    amazon_note: string;
}

export interface VentanaDisponible extends VentanaEntrega {
    available: boolean;
}

export interface VentanasDisponibles {
    windows: VentanaDisponible[];
}

// Lo que queda guardado en el pedido sobre la entrega
export interface EntregaPedido {
    tipo: 'inmediata' | 'programada';
    window: VentanaEntrega;
    label: string;
    promise_token: string;
}
