// Pedidos en el panel (GET /api/v1/admin/orders). Nombres en inglés y snake_case: son los de Laravel. Dinero en centavos.

export type FiltroPedidos = 'pending' | 'in_production' | 'shipped' | 'expired' | 'cancelled' | 'all';

export interface PedidoAdmin {
    number: string;
    channel: string;
    payment_method: 'transfer' | 'card';
    payment_status: 'pending_validation' | 'unpaid' | 'paid' | 'refunded';
    status: string;                                   // created, expired, cancelled, in_production, shipped
    customer: { name: string; email: string; phone: string | null };
    total_cents: number;
    discount_cents: number;                           // descuento del modo de venta (a todas las macetas menos la de mayor valor)
    card_fee_cents: number;                           // recargo por pagar con tarjeta
    shipping_cents: number;
    shipping_zone: string | null;
    cycle_date: string;
    dispatch_date: string;
    window: { start: string; end: string; type: string };
    /** Último día para enviar (un día antes de la entrega) y el instante en que termina ese día en Guayaquil; los calcula Laravel. */
    send_by: string;
    send_by_at: string;
    /** Si Josué avisó un retraso: el motivo, cuándo, y la fecha prometida al comprar. */
    delay?: { reason: string | null; at: string; original_window: { start: string | null; end: string | null } } | null;
    /** Motivo de la cancelación y reembolso que registró Josué (el dinero se devuelve a mano, fuera del sistema). */
    cancel_reason?: string | null;
    cancelled_at?: string | null;
    refund?: { cents: number; at: string | null } | null;
    deadline_at: string | null;
    receipt_uploaded_at: string | null;
    whatsapp_clicked_at: string | null;
    paid_at: string | null;
    production_started_at: string | null;
    shipped_at: string | null;
    tracking_number: string | null;   // guía de Servientrega
    created_at: string;
    items: {
        id: number; has_preview: boolean; has_frame_photo: boolean;
        sku: string; name: string; type: string; line_total_cents: number;
        personalization: {
            name_text?: string;
            dedication?: { mode: string; text: string };
            accessories?: { id: number; name: string; behavior: string | null }[];
            lens_color?: string | null;
            glasses_color?: string | null;
            frame_text?: string | null;
            has_frame_photo?: boolean;
        } | null;
    }[];
    shipping: { name: string; id_number: string; phone: string; email: string; address: string; reference: string; province_name?: string; canton_name?: string };
    billing: { same_as_shipping: boolean; name?: string; id_number?: string } | null;
}

export type EstadoPedidoAdmin = 'in_production' | 'shipped' | 'cancelled' | 'expired' | 'pending';
export type OrdenProduccion = 'due' | 'amount';

export function estadoDePedido(p: Pick<PedidoAdmin, 'payment_status' | 'status'>): EstadoPedidoAdmin {
    if (p.status === 'cancelled') return 'cancelled';
    if (p.status === 'shipped') return 'shipped';
    if (p.status === 'in_production') return 'in_production';
    if (p.payment_status === 'paid') return 'in_production';
    return p.status === 'expired' ? 'expired' : 'pending';
}
