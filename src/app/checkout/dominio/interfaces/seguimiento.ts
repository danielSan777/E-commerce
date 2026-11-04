// Contrato del Paso 0: pedido pagado (vista de seguimiento).
// Nombres en inglés y snake_case: son idénticos a la respuesta de Laravel. Dinero en centavos.
// Angular solo muestra estos campos; no decide el estado ni calcula el total.

export type EstadoVisible = 'confirmado' | 'en_produccion' | 'enviado' | 'cancelado' | 'reembolsado';

export interface PedidoSeguimiento {
    order_number: string;
    visible_status: EstadoVisible;
    payment: { method: 'transfer' | 'card'; status: 'paid'; paid_at: string };
    window: { start: string; end: string };
    shipment: { carrier: string; tracking_number: string | null };
    items: { name: string; name_text: string | null }[];
    total_cents: number;
}
