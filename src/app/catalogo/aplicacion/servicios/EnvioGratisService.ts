import { Injectable, computed, inject } from '@angular/core';
// AJUSTA la ruta si tu CarritoService está en otra carpeta (este archivo va en la misma carpeta que CarritoService.ts)
import { CarritoService } from '../../../carrito/aplicacion/servicios/CarritoService';
import { ModoVentaService } from './ModoVentaService';

/*
 * Envío gratis y descuento por segunda maceta, según el modo de venta vigente (ver ModoVentaService).
 * La usan el anuncio del navbar, el carrito y el pago, así todos dicen siempre lo mismo.
 *  - Modo estándar: envío gratis desde 2 macetas (o siempre, si todas las zonas cuestan $0).
 *  - Modo "todo gratis": envío gratis siempre y descuento (editable en el panel) a todas las macetas menos la de mayor valor, desde 2 macetas.
 * Lo que Laravel cobra es lo que manda: aquí solo se muestra lo mismo para que el cliente lo vea antes de pagar.
 * (Los textos dicen "dos unidades"; si cambias el número, cambia también esos textos.)
*/

@Injectable({ providedIn: 'root' })
export class EnvioGratisService {

    readonly MACETAS_PARA_ENVIO_GRATIS = 2;

    private carrito = inject(CarritoService);
    private modo = inject(ModoVentaService);

    constructor() { this.modo.cargar(); }

    // Solo cuentan las macetas personalizadas; los complementos no suman para el envío gratis ni para el descuento
    readonly macetas = computed(() => this.carrito.items().filter(i => i.tipo === 'personalizado').length);

    /** Todo el catálogo con envío gratis: modo "todo gratis" o todas las zonas habilitadas en $0. */
    readonly envioGratisSiempre = this.modo.envioGratisEnTodo;
    readonly todoGratis = this.modo.todoGratis;
    readonly descuentoPorcentaje = this.modo.descuentoPorcentaje;
    readonly recargoPorcentaje = this.modo.recargoPorcentaje;

    readonly envioGratis = computed(() => this.envioGratisSiempre() || this.macetas() >= this.modo.minimoMacetas());

    /** Con descuento por segunda maceta hay que llevar al menos 2 macetas para recibirlo. */
    readonly hayDescuento = computed(() => this.descuentoPorcentaje() > 0);
    readonly descuentoActivo = computed(() => this.hayDescuento() && this.macetas() >= 2);

    /** Descuento en dólares: el porcentaje sobre cada maceta menos la de mayor valor (esa se paga completa), cada una al centavo (mitad hacia arriba). */
    readonly descuento = computed(() => {
        if (!this.descuentoActivo()) return 0;
        const precios = this.carrito.items().filter(i => i.tipo === 'personalizado').map(i => Math.round((i.producto.precio || 0) * 100)).sort((a, b) => b - a);
        const centavos = precios.slice(1).reduce((suma, p) => suma + Math.floor(p * this.descuentoPorcentaje() / 100 + 0.5), 0);
        return centavos / 100;
    });

    /** ¿Se ofrece la segunda maceta? Con descuento: hasta llevar 2. Sin descuento: mientras el envío no sea gratis. */
    readonly ofertaSegundaMaceta = computed(() => this.hayDescuento() ? !this.descuentoActivo() : !this.envioGratis());

    /** Frase corta para la franja de promesa de la portada y de las campañas. */
    readonly textoPromo = computed(() => {
        if (this.envioGratisSiempre() && this.hayDescuento()) return `Envío gratis en todo y ${this.pct()}% de descuento en tu segunda maceta y las siguientes`;
        if (this.envioGratisSiempre()) return 'Envío gratis en todos tus pedidos';
        return `Envío gratis llevando ${this.MACETAS_PARA_ENVIO_GRATIS} macetas`;
    });

    /** Anuncio rojo del navbar: parte en negrita y el resto. */
    readonly anuncio = computed(() => {
        if (this.hayDescuento()) {
            return this.descuentoActivo()
                ? { fuerte: '¡Excelente!', resto: `Envío gratis y ${this.pct()}% de descuento en tus demás macetas` }
                : { fuerte: 'Envío gratis', resto: `en todo y ${this.pct()}% de descuento desde tu segunda maceta` };
        }
        if (this.envioGratisSiempre()) return { fuerte: 'Envío gratis', resto: 'en todos tus pedidos' };
        return this.envioGratis() ? { fuerte: '¡Excelente!', resto: 'Ya tienes envío gratis' } : { fuerte: 'Envío gratis', resto: 'desde dos unidades' };
    });

    /** Porcentaje sin decimales sobrantes: 30, no 30.0. */
    pct(): string { return String(Number(this.descuentoPorcentaje().toFixed(2))); }

    /** Subtotal menos el descuento (el envío y el recargo se suman en el pago). */
    readonly subtotalConDescuento = computed(() => this.carrito.subtotal() - this.descuento());
}
