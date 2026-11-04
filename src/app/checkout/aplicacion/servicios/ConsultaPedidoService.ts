import { Injectable } from '@angular/core';

// MOCK (Paso 0/15): "Consultar mi pedido" nunca muestra datos del pedido: Laravel reenvía al correo del pedido su enlace privado.
// La respuesta es la MISMA exista o no el pedido (no revela qué pedidos existen) y Laravel limita los intentos.
// Con backend, solo cambia el cuerpo de este método por la llamada a la API.
export const MENSAJE_CONSULTA = 'Si los datos coinciden con un pedido, te enviamos el enlace a tu correo. Revisa también la carpeta de spam.';

@Injectable({ providedIn: 'root' })
export class ConsultaPedidoService {
    async reenviarEnlace(_numeroPedido: string, _correo: string): Promise<{ message: string }> {
        return { message: MENSAJE_CONSULTA };
    }
}
