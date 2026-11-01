import { Carrito } from './../../../carrito/presentacion/paginas/carrito/carrito';
import { Injectable, computed, inject } from '@angular/core';
// AJUSTA la ruta si tu CarritoService está en otra carpeta (este archivo va en la misma carpeta que CarritoService.ts)
import { CarritoService } from '../../../carrito/aplicacion/servicios/CarritoService';

/*
 * Regla de envío gratis: desde 2 macetas personalizadas en el carrito.
 * La usan el anuncio del navbar y la pantalla del carrito, así los dos dicen siempre lo mismo.
 * (Los textos dicen "dos unidades"; si cambias el número, cambia también esos textos.)
*/

@Injectable({ providedIn: 'root' })
export class EnvioGratisService {

    readonly MACETAS_PARA_ENVIO_GRATIS = 2;

    private carrito = inject(CarritoService);

    // Solo cuentan las macetas personalizadas; los complementos no suman para el envío gratis
    readonly macetas = computed(() => this.carrito.items().filter(i => i.tipo === 'personalizado').length);

    readonly envioGratis = computed(() => this.macetas() >= this.MACETAS_PARA_ENVIO_GRATIS);
}