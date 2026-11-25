import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { SIN_CARGANDO } from '../../../shared/interceptores/cargandoInterceptor';
import { CarritoService } from './CarritoService';

/** Respuesta de Laravel (POST /api/v1/cart/quote). Dinero en centavos; `null` = todavía no se puede saber (falta el cantón). */
export interface CotizacionCarrito {
    mode: 'standard' | 'free_shipping_discount';
    subtotal_cents: number;
    discount_cents: number;
    discounted_lines: number[];
    free_shipping: boolean;
    shipping_cents: number | null;
    card_fee_cents: number | null;
    total_transfer_cents: number | null;
    total_card_cents: number | null;
    shipping_available: boolean | null;
}

/*
 * Cotización del carrito. Angular no calcula descuento, envío, recargo ni total: manda a Laravel los productos y el cantón
 * y muestra lo que responde (la misma calculadora que usa el pedido). Se vuelve a pedir cada vez que cambia el carrito o el cantón.
 */
@Injectable({ providedIn: 'root' })
export class CotizacionService {
    private http = inject(HttpClient);
    private api = inject(API_URL);
    private carrito = inject(CarritoService);
    private navegador = isPlatformBrowser(inject(PLATFORM_ID));
    private pendiente?: Subscription;

    /** Código del cantón de destino; lo fija la pantalla de pago. Vacío = aún no se eligió. */
    readonly canton = signal('');
    readonly cotizacion = signal<CotizacionCarrito | null>(null);
    readonly calculando = signal(false);
    readonly fallo = signal(false);

    /** Dólares para mostrar (centavos que entregó Laravel ÷ 100). */
    readonly descuento = computed(() => (this.cotizacion()?.discount_cents ?? 0) / 100);

    constructor() {
        effect(() => {
            const items = this.carrito.items();
            const canton = this.canton();
            untracked(() => this.pedir(items.map(i => ({ slug: String(i.producto.id), quantity: 1 })), canton));
        });
    }

    private pedir(items: { slug: string; quantity: number }[], canton: string): void {
        this.pendiente?.unsubscribe();
        if (!this.navegador || items.length === 0) {
            this.cotizacion.set(null);
            this.calculando.set(false);
            this.fallo.set(false);
            return;
        }
        this.calculando.set(true);
        this.fallo.set(false);
        this.pendiente = this.http.post<CotizacionCarrito>(`${this.api}/cart/quote`, { items, canton_code: canton || null }, { context: new HttpContext().set(SIN_CARGANDO, true) }).subscribe({
            next: r => { this.cotizacion.set(r); this.calculando.set(false); },
            error: () => { this.cotizacion.set(null); this.calculando.set(false); this.fallo.set(true); },
        });
    }

    /** Vuelve a pedir la cotización (por ejemplo, tras un «el total cambió» al crear el pedido). */
    recargar(): void {
        const items = this.carrito.items();
        this.pedir(items.map(i => ({ slug: String(i.producto.id), quantity: 1 })), this.canton());
    }
}
