import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { API_URL } from '../../../core/configuracion/api';
import { SIN_CARGANDO } from '../../../shared/interceptores/cargandoInterceptor';

// Respuesta de Laravel (GET /api/v1/store/pricing): los valores del modo de venta vigente
export interface PreciosTienda {
    mode: 'standard' | 'free_shipping_discount';
    free_shipping_min_planters: number;
    card_surcharge_percent: number;    // 0 en el modo "todo gratis"
    discount_percent: number;          // 0 en el modo estándar
    free_shipping_everywhere: boolean; // modo "todo gratis" o todas las zonas habilitadas en $0
}

// Mientras no llegue la respuesta se muestra el modo estándar (el mismo de siempre)
const ESTANDAR: PreciosTienda = { mode: 'standard', free_shipping_min_planters: 2, card_surcharge_percent: 6, discount_percent: 0, free_shipping_everywhere: false };

/*
 * Modo de venta. El administrador elige en el panel entre dos formas de vender y Laravel entrega los valores vigentes
 * (envío, recargo y descuento); este servicio solo los guarda para que el banner, el carrito y el pago digan lo mismo.
 * Laravel es quien calcula el total real del pedido y avisa (`price_changed`) si lo que se vio ya cambió.
 */
@Injectable({ providedIn: 'root' })
export class ModoVentaService {
    private http = inject(HttpClient);
    private api = inject(API_URL);
    private pedido = false;

    readonly precios = signal<PreciosTienda>(ESTANDAR);
    readonly todoGratis = computed(() => this.precios().mode === 'free_shipping_discount');
    readonly envioGratisEnTodo = computed(() => this.precios().free_shipping_everywhere);
    readonly minimoMacetas = computed(() => this.precios().free_shipping_min_planters);
    readonly recargoPorcentaje = computed(() => this.precios().card_surcharge_percent);
    readonly descuentoPorcentaje = computed(() => this.precios().discount_percent);

    /** Pide el modo vigente una sola vez. Sin spinner global: la pantalla ya se está viendo. */
    cargar(): void {
        if (this.pedido) return;
        this.pedido = true;
        this.http.get<PreciosTienda>(`${this.api}/store/pricing`, { context: new HttpContext().set(SIN_CARGANDO, true) }).subscribe({
            next: r => this.precios.set(r),
            error: () => { this.pedido = false; },   // se queda el modo estándar y se reintenta en la próxima pantalla
        });
    }

    /** Vuelve a pedir el modo vigente (por ejemplo, al regresar a la pestaña después de un rato). */
    recargar(): void {
        this.pedido = false;
        this.cargar();
    }
}
