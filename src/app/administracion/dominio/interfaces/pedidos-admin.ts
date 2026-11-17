// Pedidos en el panel (GET /api/v1/admin/orders). Nombres en inglés y snake_case: son los de Laravel. Dinero en centavos.

export type FiltroPedidos = 'pending' | 'paid' | 'expired' | 'cancelled' | 'all';

export interface PedidoAdmin {
    number: string;
    channel: string;
    payment_method: 'transfer' | 'card';
    payment_status: 'pending_validation' | 'unpaid' | 'paid';
    status: string;                                   // created, expired, cancelled, ready_for_production…
    customer: { name: string; email: string; phone: string | null };
    total_cents: number;
    shipping_cents: number;
    shipping_zone: string | null;
    cycle_date: string;
    dispatch_date: string;
    window: { start: string; end: string; type: string };
    deadline_at: string | null;
    receipt_uploaded_at: string | null;
    whatsapp_clicked_at: string | null;
    paid_at: string | null;
    created_at: string;
    items: { sku: string; name: string; type: string; line_total_cents: number; personalization: { name_text?: string; dedication?: { mode: string; text: string } } | null }[];
    shipping: { name: string; id_number: string; phone: string; email: string; address: string; reference: string; province_name?: string; canton_name?: string };
    billing: { same_as_shipping: boolean; name?: string; id_number?: string } | null;
}

export type EstadoPedidoAdmin = 'paid' | 'cancelled' | 'expired' | 'pending';

export function estadoDePedido(p: Pick<PedidoAdmin, 'payment_status' | 'status'>): EstadoPedidoAdmin {
    if (p.status === 'cancelled') return 'cancelled';
    if (p.payment_status === 'paid') return 'paid';
    return p.status === 'expired' ? 'expired' : 'pending';
}
