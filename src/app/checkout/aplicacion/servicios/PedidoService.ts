import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';
import { ItemCarrito } from '../../../carrito/aplicacion/servicios/CarritoService';
import { API_URL } from '../../../core/configuracion/api';
import { AtribucionService } from '../../../core/seguimiento/AtribucionService';
import { conErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { DatosCheckout } from './CheckoutService';
import { PedidoPendienteRecordadoService } from './PedidoPendienteRecordadoService';
import { UbicacionesService } from './UbicacionesService';
import { EntregaPedido } from '../../dominio/interfaces/promesa';
import { PedidoPendiente } from '../../dominio/interfaces/pedido_pendiente';
import { armarSolicitud } from '../../dominio/validaciones/solicitud_pedido';

export type MetodoPago = DatosCheckout['metodoPago'];

// Lo que se guarda al confirmar el pedido: una copia de todo, para que la pantalla de confirmación
// no dependa del carrito, que se vacía al terminar. Número, token, plazo y datos para pagar los pone Laravel.
export interface Pedido {
    numero: string;           // JDS-48213
    token: string;            // privado y largo: es el enlace /pedido/{token}
    fecha: string;            // ISO
    metodo: MetodoPago;
    pagoConfirmado: boolean;  // transferencia: false hasta que Josué valida el comprobante
    pagoSimulado: boolean;    // true = PayPhone sin cobro real (solo pruebas); nunca debe llegar así a producción
    limitePago: string | null; // ISO; solo transferencia (lo fija Laravel)
    entrega: EntregaPedido;
    pendiente: PedidoPendiente | null;   // transferencia: la vista que devolvió Laravel (cuentas, plazo, enlace de WhatsApp)
    eventId: string | null;   // para que el pixel y la API de conversiones cuenten la compra una sola vez
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
    entrega: EntregaPedido;
}

interface RespuestaCheckout {
    order_number: string;
    token: string;
    event_id: string;
    order: PedidoPendiente;
}

@Injectable({ providedIn: 'root' })
export class PedidoService {
    private http = inject(HttpClient);
    private api = inject(API_URL);
    private ubicaciones = inject(UbicacionesService);
    private atribucion = inject(AtribucionService);
    private recordado = inject(PedidoPendienteRecordadoService);

    // sessionStorage: son datos personales y se borran al cerrar la pestaña
    private readonly CLAVE = 'pedido-jardin-de-sele';

    readonly pedido = signal<Pedido | null>(null);

    /**
     * Transferencia: Laravel crea el pedido (precio, ventana y cupo se validan allá) y devuelve número, token y plazo.
     * Si algo cambió responde un error (`price_changed`, `window_changed`, `capacity_full`…) que la pantalla muestra.
     * Tarjeta (PayPhone): todavía no hay cobro real, sigue siendo una simulación local (Paso 13).
     */
    crear(nuevo: NuevoPedido): Observable<Pedido> {
        if (nuevo.metodo === 'payphone') return of(this.guardarPedido(this.simulado(nuevo)));

        const solicitud = armarSolicitud({
            items: nuevo.items,
            datos: nuevo.datos,
            totalCentavos: Math.round(nuevo.total * 100),
            entrega: nuevo.entrega,
            tracking: { first_touch: this.atribucion.first(), last_touch: this.atribucion.last() },
        }, {
            provincia: n => this.ubicaciones.codigoProvincia(n),
            canton: (p, c) => this.ubicaciones.codigoCanton(p, c),
        });

        return this.http.post<RespuestaCheckout>(`${this.api}/checkout`, solicitud).pipe(
            map(r => this.desdeApi(nuevo, r)),
            tap(p => {
                this.guardarPedido(p);
                // Para poder volver al pedido (y a WhatsApp) aunque se cierre la pestaña
                this.recordado.recordar(p.numero, p.token);
            }),
            conErrorApi(),
        );
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

    private desdeApi(nuevo: NuevoPedido, r: RespuestaCheckout): Pedido {
        return {
            ...nuevo,
            numero: r.order_number,
            token: r.token,
            eventId: r.event_id,
            fecha: new Date().toISOString(),
            limitePago: r.order.deadline_at,
            entrega: { ...nuevo.entrega, window: r.order.window },
            pendiente: r.order,
            pagoConfirmado: false,
            pagoSimulado: false,
        };
    }

    // IMPORTANTE: todavía no hay cobro real con PayPhone. Se muestra como "Pago confirmado (pruebas)".
    // Con el Paso 13, Laravel crea el pedido y solo confirma el pago cuando PayPhone lo confirme.
    private simulado(nuevo: NuevoPedido): Pedido {
        return {
            ...nuevo,
            numero: `JDS-${String(Date.now()).slice(-5)}`,
            token: `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll('-', ''),
            eventId: null,
            fecha: new Date().toISOString(),
            limitePago: null,
            pendiente: null,
            pagoConfirmado: true,
            pagoSimulado: true,
        };
    }

    private guardarPedido(pedido: Pedido): Pedido {
        this.pedido.set(pedido);
        try {
            if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(this.CLAVE, JSON.stringify(pedido));
        } catch {
            // sin espacio o bloqueado: el pedido sigue en memoria mientras la página esté abierta
        }
        return pedido;
    }
}
