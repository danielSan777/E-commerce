import { TestBed } from '@angular/core/testing';
import type { ItemCarrito } from '../../carrito/aplicacion/servicios/CarritoService';
import { cotizacionApi } from '../../testing/cotizacion-api';
import { AnalyticsService } from './AnalyticsService';
import { DatosDeCompra, parametrosDeCarrito, parametrosDeCompra, parametrosDeProducto } from './ParametrosComercio';

const linea = (sku: string | undefined, precio: number): ItemCarrito => ({
    uid: 'u', tipo: 'personalizado', producto: { id: 'doctor', sku, nombre: 'Doctor', precio }, vista: '', ruta: '', resumen: [],
});

describe('Parámetros de los eventos de comercio', () => {
    it('producto: valor, moneda y línea con el SKU', () => {
        expect(parametrosDeProducto('JDS-005', 'Doctor', 20)).toEqual({ currency: 'USD', value: 20, items: [{ item_id: 'JDS-005', item_name: 'Doctor', price: 20, quantity: 1 }] });
    });

    it('carrito: el valor lo da la cotización de Laravel (netos de descuento, sin envío ni recargo)', () => {
        const p = parametrosDeCarrito([linea('JDS-005', 20)], cotizacionApi({ discount_cents: 570, merchandise_value_cents: 1430 }));

        expect(p['value']).toBe(14.3);
        expect(p['currency']).toBe('USD');
        expect(p['items']).toEqual([{ item_id: 'JDS-005', item_name: 'Doctor', price: 20, quantity: 1 }]);
    });

    it('carrito sin cotización: no inventa valor, solo manda las líneas (con el id si no hay SKU)', () => {
        const p = parametrosDeCarrito([linea(undefined, 20)], null);

        expect(p['value']).toBeUndefined();
        expect(p['currency']).toBeUndefined();
        expect(p['items']).toEqual([{ item_id: 'doctor', item_name: 'Doctor', price: 20, quantity: 1 }]);
    });

    it('compra: centavos de Laravel a dólares con el mismo event_id y la referencia del pedido', () => {
        const d: DatosDeCompra = { event_id: 'purchase-abc', transaction_id: 'JDS-1035', value_cents: 2150, currency: 'USD', items: [{ sku: 'JDS-005', name: 'Doctor', price_cents: 2150, quantity: 1 }] };

        expect(parametrosDeCompra(d)).toEqual({ event_id: 'purchase-abc', transaction_id: 'JDS-1035', currency: 'USD', value: 21.5, items: [{ item_id: 'JDS-005', item_name: 'Doctor', price: 21.5, quantity: 1 }] });
    });

    it('trackUnaVez mide la compra una sola vez por pedido en la pestaña', () => {
        sessionStorage.clear();
        (window as unknown as { dataLayer: unknown[] }).dataLayer = [];
        const a = TestBed.inject(AnalyticsService);
        a.trackUnaVez('jds_purchase_JDS-1', 'purchase', { value: 1 });
        a.trackUnaVez('jds_purchase_JDS-1', 'purchase', { value: 1 });

        expect((window as unknown as { dataLayer: unknown[] }).dataLayer).toEqual([{ event: 'purchase', value: 1 }]);
    });
});
