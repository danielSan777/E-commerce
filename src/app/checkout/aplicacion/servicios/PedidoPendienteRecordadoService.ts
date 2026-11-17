import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface PedidoRecordado {
    numero: string;
    token: string;
    guardado: string;   // ISO: cuándo se guardó (pasados 30 días se deja de recordar)
}

const DIAS_RECORDADO = 30;

const CLAVE = 'jds_pedido_pendiente';

/**
 * Recuerda en este navegador el último pedido (pendiente de pago, en producción o enviado) para poder volver a su
 * seguimiento aunque se cierre la pestaña. Solo guarda número y enlace privado: nada de datos personales.
 * El estado real lo dice Laravel cada vez que se abre el aviso.
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
            if (g?.token && g.numero && ahora - Date.parse(g.guardado) < DIAS_RECORDADO * 86_400_000) { this.pedido.set(g); return; }
            if (g) localStorage.removeItem(CLAVE);   // muy viejo o dañado: no sirve
        } catch { /* almacenamiento bloqueado o dañado */ }
        this.pedido.set(null);
    }

    recordar(numero: string, token: string): void {
        const p: PedidoRecordado = { numero, token, guardado: new Date().toISOString() };
        this.pedido.set(p);
        if (!this.esNavegador) return;
        try { localStorage.setItem(CLAVE, JSON.stringify(p)); } catch { /* sin espacio: queda solo en memoria */ }
    }

    /** El pedido venció, se canceló o no existe: deja de avisarse. */
    olvidar(): void {
        this.pedido.set(null);
        if (!this.esNavegador) return;
        try { localStorage.removeItem(CLAVE); } catch { /* sin acceso */ }
    }
}
