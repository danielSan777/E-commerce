import { DOCUMENT } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ModoVentaService } from '../../catalogo/aplicacion/servicios/ModoVentaService';
import { UbicacionesService } from '../../checkout/aplicacion/servicios/UbicacionesService';

/** Tiempo mínimo fuera de la pestaña para refrescar al volver (evita recargar por un cambio de pestaña de un segundo). */
export const SEGUNDOS_FUERA_PARA_REFRESCAR = 30;

// Pantallas donde hay trabajo en curso (fotos del carrito, formularios, pago, panel): nunca se recargan solas.
const PRIMER_TRAMO_CON_ESTADO = new Set(['admin', 'checkout', 'carrito', 'mi-cuenta', 'pedido', 'ingresar', 'crear-cuenta', 'consultar-pedido']);

/** ¿La ruta es una pantalla pública de solo lectura, que se puede recargar completa sin perder nada? */
export function esRutaRecargable(url: string): boolean {
    const ruta = url.split(/[?#]/)[0];
    const tramos = ruta.split('/').filter(Boolean);
    if (tramos.length === 0) return true;
    if (PRIMER_TRAMO_CON_ESTADO.has(tramos[0])) return false;
    if (tramos.includes('personalizar')) return false;
    return true;
}

/*
 * Al volver a la pestaña después de un rato: refresca lo compartido (modo de venta, ubicaciones; la promesa de entrega
 * ya se refresca sola) y, en pantallas públicas de solo lectura, recarga la página completa. Eso también trae una
 * versión nueva del sitio si se publicó mientras la pestaña estaba abierta.
 */
@Injectable({ providedIn: 'root' })
export class PestanaService {
    private doc = inject(DOCUMENT);
    private router = inject(Router);
    private modo = inject(ModoVentaService);
    private ubicaciones = inject(UbicacionesService);
    private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));
    private oculta: number | null = null;
    private iniciado = false;

    /** Hoja de la recarga completa; se puede sustituir en pruebas. */
    recargarPagina: () => void = () => location.reload();

    iniciar(): void {
        if (!this.esNavegador || this.iniciado) return;
        this.iniciado = true;
        this.doc.addEventListener('visibilitychange', this.escuchar);
    }

    /** Deja de escuchar (se usa en las pruebas; en la app el servicio vive mientras la pestaña esté abierta). */
    detener(): void {
        this.doc.removeEventListener('visibilitychange', this.escuchar);
        this.iniciado = false;
    }

    private escuchar = () => this.alCambiarVisibilidad();

    private alCambiarVisibilidad(): void {
        if (this.doc.visibilityState === 'hidden') {
            this.oculta = Date.now();
            return;
        }
        const desde = this.oculta;
        this.oculta = null;
        if (desde === null || Date.now() - desde < SEGUNDOS_FUERA_PARA_REFRESCAR * 1000) return;
        if (esRutaRecargable(this.router.url)) {
            this.recargarPagina();
            return;
        }
        this.modo.recargar();
        this.ubicaciones.recargar();
    }
}
