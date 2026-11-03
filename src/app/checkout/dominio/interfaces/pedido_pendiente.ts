// Contrato del Paso 0: pedido pendiente de pago (transferencia).
// Nombres en inglés y snake_case: son idénticos a la respuesta de Laravel. Dinero en centavos.
// Angular solo muestra estos campos; no calcula el plazo, el estado ni el total.

export interface CuentaBancariaContrato {
    bank: string;
    type: string;
    number: string;
    holder: string;
    id_number: string;
}

export type EstadoPedidoPendiente = 'pending_payment' | 'expired';

export interface PedidoPendiente {
    order_number: string;
    status: EstadoPedidoPendiente;
    total_cents: number;
    deadline_at: string;          // ISO 8601 UTC
    deadline_label: string;       // "Paga antes del martes 10 de noviembre, 07:50"
    window: { start: string; end: string };
    bank_accounts: CuentaBancariaContrato[];
    receipt: { uploaded: boolean };
    whatsapp_url: string;
}
