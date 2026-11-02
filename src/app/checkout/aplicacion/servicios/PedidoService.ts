import { Injectable, signal } from '@angular/core';
import { ItemCarrito } from '../../../carrito/aplicacion/servicios/CarritoService';
import { DatosCheckout } from './CheckoutService';

export type MetodoPago = DatosCheckout['metodoPago'];

// Lo que se guarda al confirmar el pedido: una copia de todo, para que la pantalla de confirmación
// (y el mensaje de WhatsApp) no dependan del carrito, que se vacía al terminar.
export interface Pedido {
    numero: string;           // JDS-48213
    fecha: string;            // ISO
    metodo: MetodoPago;
    pagoConfirmado: boolean;  // transferencia: false hasta validar el comprobante · PayPhone: ver nota en crear()
    items: ItemCarrito[];
    datos: DatosCheckout;
    subtotal: number;
    envio: number;
    envioGratis: boolean;
    recargo: number;          // cargo de PayPhone (0 si es transferencia)
    total: number;
}

export interface NuevoPedido {
    metodo: MetodoPago;
    items: ItemCarrito[];
    datos: DatosCheckout;
    subtotal: number;
    envio: number;
    envioGratis: boolean;
    recargo: number;
    total: number;
}

@Injectable({ providedIn: 'root' })
export class PedidoService {

    // sessionStorage: son datos personales y se borran al cerrar la pestaña
    private readonly CLAVE = 'pedido-jardin-de-sele';

    readonly pedido = signal<Pedido | null>(null);

    crear(nuevo: NuevoPedido): Pedido {
        const pedido: Pedido = {
            ...nuevo,
            numero: this.generarNumero(),
            fecha: new Date().toISOString(),

            // IMPORTANTE: todavía no hay cobro real con PayPhone (necesita backend). Por ahora la pantalla de
            // PayPhone se muestra como "Pago confirmado". Cuando conectes PayPhone de verdad, esto debe ser
            // false aquí y pasar a true solo cuando PayPhone confirme el pago.
            pagoConfirmado: nuevo.metodo === 'payphone',
        };

        this.pedido.set(pedido);
        this.guardar(pedido);
        return pedido;
    }

    // Se llama ya en el navegador (después del primer render) para que servidor y cliente pinten lo mismo
    restaurar(): void {
        if (this.pedido()) return;

        try {
            if (typeof sessionStorage === 'undefined') return;
            const guardado = JSON.parse(sessionStorage.getItem(this.CLAVE) ?? 'null');
            if (guardado && typeof guardado === 'object' && guardado.numero) {
                this.pedido.set(guardado as Pedido);
            }
        } catch {
            // datos dañados o almacenamiento bloqueado: no hay pedido que mostrar
        }
    }

    private guardar(pedido: Pedido): void {
        try {
            if (typeof sessionStorage === 'undefined') return;
            sessionStorage.setItem(this.CLAVE, JSON.stringify(pedido));
        } catch {
            // sin espacio o bloqueado: el pedido sigue en memoria mientras la página esté abierta
        }
    }

    // Número de pedido de ejemplo (JDS-48213). Sin backend no hay un contador real:
    // cuando exista la base de datos, el número debe venir de ahí.
    private generarNumero(): string {
        return `JDS-${String(Date.now()).slice(-5)}`;
    }
}