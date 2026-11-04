import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { PedidoToken } from './pedido-token';
import { NuevoPedido, PedidoService } from '../../../aplicacion/servicios/PedidoService';
import { DatosCheckout } from '../../../aplicacion/servicios/CheckoutService';
import { ItemCarrito } from '../../../../carrito/aplicacion/servicios/CarritoService';

const item: ItemCarrito = {
    uid: 'a', tipo: 'personalizado', producto: { id: 'doctor', nombre: 'Doctor', precio: 25 }, vista: '', ruta: '', resumen: [],
    configuracion: { accesorios: [], nombre: 'Josué de Santis', colorLentes: 'negro', colorGafas: 'negro', dedicatoria: '', textoMarco: '', sinTarjeta: true, fotoMarcoNombre: '' },
};

function nuevo(metodo: 'payphone' | 'transferencia'): NuevoPedido {
    return {
        metodo, items: [item], datos: { metodoPago: metodo } as DatosCheckout,
        subtotal: 25, envio: 3.5, envioGratis: false, recargo: 0, total: 28.5, marketing: false,
        entrega: { tipo: 'inmediata', window: { start: '2026-11-12', end: '2026-11-13' }, label: 'x', promise_token: 't' },
    };
}

async function montar(metodo: 'payphone' | 'transferencia', tokenMalo = false) {
    let token = '';
    TestBed.configureTestingModule({
        imports: [PedidoToken],
        providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => token } } } }],
    });
    const creado = TestBed.inject(PedidoService).crear(nuevo(metodo));
    token = tokenMalo ? creado.token.slice(0, -1) + 'x' : creado.token;

    const fixture = TestBed.createComponent(PedidoToken);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
}

describe('PedidoToken (/pedido/{token})', () => {
    it('pedido pagado: muestra el seguimiento con el estado, la ventana y el nombre', async () => {
        const html = await montar('payphone');

        expect(html.textContent).toContain('Confirmado');
        expect(html.textContent).toContain('Del 12 al 13 de noviembre');
        expect(html.textContent).toContain('Josué de Santis');
        expect(html.textContent).toContain('Servientrega');
        expect(html.textContent).not.toContain('Entregado');
    });

    it('transferencia sin pagar: muestra el pedido pendiente', async () => {
        const html = await montar('transferencia');

        expect(html.textContent).toContain('Pendiente de pago');
        expect(html.textContent).not.toContain('Estado de tu pedido');
    });

    it('un carácter distinto en el token da 404', async () => {
        const html = await montar('payphone', true);

        expect(html.textContent).not.toContain('JDS-');
    });
});
