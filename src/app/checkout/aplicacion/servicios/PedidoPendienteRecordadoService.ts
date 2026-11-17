import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface PedidoRecordado {
    numero: string;
    token: string;
    vence: string;   // ISO: cuando vence el plazo de pago
}

const CLAVE = 'jds_pedido_pendiente';

/**
 * Recuerda en este navegador el último pedido por transferencia pendiente de pago, para poder volver a él
 * ("Tienes un pedido pendiente") aunque se cierre la pestaña. Solo guarda número, enlace privado y vencimiento:
 * nada de datos personales. La verdad sobre el pedido sigue en Laravel.
 */
@Injectable({ providedIn: 'root' })
export class PedidoPendienteRecordadoService {
    private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

    readonly pedido = signal<PedidoRecordado | null>(null);

    /** Se llama en el navegador después del primer render, para que servidor y cliente pinten lo mismo. */
    restaurar(ahora = Date.now()): void {
        if (!this.esNavegador) return;
        try {
            const g = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as PedidoRecordado | null;
            if (g?.token && g.numero && Date.parse(g.vence) > ahora) { this.pedido.set(g); return; }
            if (g) localStorage.removeItem(CLAVE);   // ya venció: no sirve
        } catch { /* almacenamiento bloqueado o dañado */ }
        this.pedido.set(null);
    }

    recordar(p: PedidoRecordado): void {
        this.pedido.set(p);
        if (!this.esNavegador) return;
        try { localStorage.setItem(CLAVE, JSON.stringify(p)); } catch { /* sin espacio: queda solo en memoria */ }
    }

    /** El pedido ya se pagó, venció, se canceló o no existe: deja de avisarse. */
    olvidar(): void {
        this.pedido.set(null);
        if (!this.esNavegador) return;
        try { localStorage.removeItem(CLAVE); } catch { /* sin acceso */ }
    }
}
