import { PedidoPendiente } from '../checkout/dominio/interfaces/pedido_pendiente';
import { PedidoSeguimiento } from '../checkout/dominio/interfaces/seguimiento';

// Respuestas de ejemplo de Laravel para los pedidos (contrato del Paso 0). Solo para pruebas.

export const TOKEN_PRUEBA = 'a'.repeat(64);

export const PENDIENTE_API: PedidoPendiente = {
    order_number: 'JDS-48213',
    status: 'pending_payment',
    total_cents: 2850,
    deadline_at: '2026-11-04T04:00:00Z',
    deadline_label: 'Paga antes del martes 3 de noviembre, 23:00',
    window: { start: '2026-11-12', end: '2026-11-13' },
    bank_accounts: [
        { bank: 'Banco Guayaquil', type: 'Cuenta de ahorros', number: '17488885', holder: 'JOSUE DE SANTIS', id_number: '0930247994' },
        { bank: 'Banco Nuevo Andino', type: 'Cuenta corriente', number: '555', holder: 'JOSUE DE SANTIS', id_number: '0930247994' },
    ],
    receipt: { uploaded: false },
    whatsapp_url: `https://api.test/api/v1/orders/${TOKEN_PRUEBA}/whatsapp`,
    whatsapp_message: `Hola 🌿 Te envío el comprobante de mi pedido JDS-48213.\nTotal: $28.50\n• Doctor\nhttps://jardindesele.com/pedido/${TOKEN_PRUEBA}`,
    share: { title: 'Pedido JDS-48213 · Jardín de Sele', description: 'Doctor · Total $28.50', image: `https://api.test/api/v1/orders/${TOKEN_PRUEBA}/preview` },
};

export const SEGUIMIENTO_API: PedidoSeguimiento = {
    order_number: 'JDS-48213',
    visible_status: 'confirmado',
    payment: { method: 'transfer', status: 'paid', paid_at: '2026-11-03T18:00:00Z' },
    window: { start: '2026-11-12', end: '2026-11-13' },
    shipment: { carrier: 'Servientrega', tracking_number: null, tracking_url: null },
    items: [{ name: 'Doctor', name_text: 'Josué de Santis' }],
    total_cents: 2850,
    share: PENDIENTE_API.share,
};

export const CHECKOUT_API = { order_number: 'JDS-48213', token: TOKEN_PRUEBA, event_id: 'evt-1', analytics: { event_id: 'evt-1', transaction_id: 'JDS-48213', value_cents: 2500, currency: 'USD', items: [{ sku: 'MAC-001', name: 'Doctor', price_cents: 2500, quantity: 1 }] }, order: PENDIENTE_API };
