import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, from, map, of, switchMap, tap, throwError } from 'rxjs';
import { CarritoService, ItemCarrito } from '../../../carrito/aplicacion/servicios/CarritoService';
import { API_URL } from '../../../core/configuracion/api';
import { AnalyticsService } from '../../../core/seguimiento/AnalyticsService';
import { DatosDeCompra, parametrosDeCompra } from '../../../core/seguimiento/ParametrosComercio';
import { ConsentimientoService } from '../../../core/seguimiento/ConsentimientoService';
import { AtribucionService } from '../../../core/seguimiento/AtribucionService';
import { ErrorApi } from '../../../cuenta/dominio/interfaces/sesion';
import { conErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { DatosCheckout } from './CheckoutService';
import { PedidoPendienteRecordadoService } from './PedidoPendienteRecordadoService';
import { UbicacionesService } from './UbicacionesService';
import { EntregaPedido } from '../../dominio/interfaces/promesa';
import { PedidoPendiente } from '../../dominio/interfaces/pedido_pendiente';
import { reducirFoto } from '../reducirFoto';
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
    descuento?: number;       // descuento del modo de venta en dólares (pedidos guardados antes no lo traen)
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
    descuento?: number;
    recargo: number;
    total: number;
    entrega: EntregaPedido;
}

interface RespuestaCheckout {
    order_number: string;
    token: string;
    event_id: string;
    analytics: DatosDeCompra;
    order: PedidoPendiente;
}

@Injectable({ providedIn: 'root' })
export class PedidoService {
    private http = inject(HttpClient);
    private api = inject(API_URL);
    private ubicaciones = inject(UbicacionesService);
    private atribucion = inject(AtribucionService);
    private consentimiento = inject(ConsentimientoService);
    private recordado = inject(PedidoPendienteRecordadoService);
    private carrito = inject(CarritoService);
    private analytics = inject(AnalyticsService);

    // sessionStorage: son datos personales y se borran al cerrar la pestaña
    private readonly CLAVE = 'pedido-jardin-de-sele';

    readonly pedido = signal<Pedido | null>(null);

    /**
     * Transferencia: Laravel crea el pedido (precio, ventana y cupo se validan allá) y devuelve número, token y plazo.
     * Si algo cambió responde un error (`price_changed`, `window_changed`, `capacity_full`…) que la pantalla muestra.
     * Tarjeta (PayPhone): Laravel crea el pedido con el recargo y aparta el cupo; el pedido queda SIN pagar hasta que
     * Laravel confirme el cobro con PayPhone (`marcarPagadoConTarjeta`). Nada se calcula ni se confirma aquí.
     */
    crear(nuevo: NuevoPedido): Observable<Pedido> {

        return this.fotosDelMarco(nuevo.items).pipe(
            map(fotosMarco => armarSolicitud({
                items: nuevo.items,
                datos: nuevo.datos,
                totalCentavos: Math.round(nuevo.total * 100),
                entrega: nuevo.entrega,
                tracking: { ...this.atribucion.identificadores(), page_url: typeof location === 'undefined' ? null : location.href, first_touch: this.atribucion.first(), last_touch: this.atribucion.last(), cookie_consent: { marketing: this.consentimiento.marketing() } },
                fotosMarco,
            }, {
                provincia: n => this.ubicaciones.codigoProvincia(n),
                canton: (p, c) => this.ubicaciones.codigoCanton(p, c),
            })),
            switchMap(solicitud => this.http.post<RespuestaCheckout>(`${this.api}/checkout`, solicitud).pipe(conErrorApi())),
            tap(r => {
                // Transferencia: el pedido quedó hecho pero sin pagar; se mide como place_order (la compra con tarjeta se mide al aprobarse el cobro)
                if (nuevo.metodo !== 'payphone') this.analytics.track('place_order', { payment_type: 'transfer', ...parametrosDeCompra(r.analytics) });
            }),
            map(r => this.desdeApi(nuevo, r)),
            tap(p => {
                this.guardarPedido(p);
                // Para poder volver al pedido (y a WhatsApp) aunque se cierre la pestaña; con tarjeta se recuerda al pagar
                if (p.metodo !== 'payphone') this.recordado.recordar(p.numero, p.token);
            }),
        );
    }

    /**
     * La foto del marco vive en memoria (no cabe en localStorage): se reduce y se manda con el pedido para que
     * Josué la tenga al producir. Sin foto en memoria no se manda nada y Laravel avisa si el marco la exige.
     */
    private fotosDelMarco(items: ItemCarrito[]): Observable<Record<string, string>> {
        const conFoto = items.filter(i => this.carrito.archivosDe(i.uid).fotoMarco);
        if (!conFoto.length) return of({});
        return from(Promise.all(conFoto.map(async i => [i.uid, await reducirFoto(this.carrito.archivosDe(i.uid).fotoMarco!)] as const)))
            .pipe(
                map(pares => Object.fromEntries(pares)),
                // Error al leer o reducir la foto: se explica tal cual (no es un problema de conexión)
                catchError((e: Error) => throwError(() => ({ status: 0, code: 'frame_photo_error', message: e.message }) satisfies ErrorApi)),
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
            limitePago: nuevo.metodo === 'payphone' ? null : r.order.deadline_at,
            entrega: { ...nuevo.entrega, window: r.order.window },
            pendiente: nuevo.metodo === 'payphone' ? null : r.order,
            pagoConfirmado: false,
            pagoSimulado: false,
        };
    }

    /**
     * Laravel confirmó el cobro con PayPhone: el pedido guardado en esta pestaña pasa a pagado.
     * Devuelve false si el pedido de la pestaña no es ese (otro navegador o sesión cerrada).
     */
    marcarPagadoConTarjeta(numero: string, simulado: boolean): boolean {
        const p = this.pedido();
        if (!p || p.numero !== numero) return false;
        this.guardarPedido({ ...p, pagoConfirmado: true, pagoSimulado: simulado });
        this.recordado.recordar(p.numero, p.token);
        return true;
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
