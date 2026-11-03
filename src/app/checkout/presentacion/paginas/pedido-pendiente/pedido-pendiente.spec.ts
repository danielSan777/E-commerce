import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { PedidoPendiente } from './pedido-pendiente';
import { NuevoPedido, PedidoService } from '../../../aplicacion/servicios/PedidoService';
import { DatosCheckout } from '../../../aplicacion/servicios/CheckoutService';

function nuevo(): NuevoPedido {
    return {
        metodo: 'transferencia', items: [], datos: { metodoPago: 'transferencia' } as DatosCheckout,
        subtotal: 25, envio: 3.5, envioGratis: false, recargo: 0, total: 28.5, marketing: false,
        entrega: { tipo: 'inmediata', window: { start: '2026-11-12', end: '2026-11-13' }, label: 'x', promise_token: 't' },
    };
}

// Crea el pedido guardado (si se pide) y abre la pantalla con el token que devuelve `elegirToken`
async function montar(elegirToken: (creado: string) => string = t => t, crear = true) {
    const rutaDe = { snapshot: { paramMap: { get: () => token } } };
    let token = '';

    TestBed.configureTestingModule({
        imports: [PedidoPendiente],
        providers: [provideRouter([]), { provide: ActivatedRoute, useValue: rutaDe }],
    });

    const pedidos = TestBed.inject(PedidoService);
    const creado = crear ? pedidos.crear(nuevo()).token : '';
    token = elegirToken(creado);

    const fixture = TestBed.createComponent(PedidoPendiente);
    await fixture.whenStable();
    return fixture;
}

describe('PedidoPendiente (/pedido/{token})', () => {
    it('con el token correcto muestra el número, el plazo, las cuentas y el aviso de que no se edita', async () => {
        const fixture = await montar();
        const texto: string = fixture.nativeElement.textContent;

        expect(texto).toContain('JDS-');
        expect(texto).toContain('Paga antes del');
        expect(texto).toContain('JOSUE DE SANTIS');
        expect(texto).toContain('Subir comprobante');
        expect(texto).toContain('ya no se puede editar');
    });

    it('con un token que no es del pedido guardado muestra el 404', async () => {
        const fixture = await montar(() => 'otro-token');

        expect(fixture.nativeElement.textContent).toContain('404');
    });

    it('rechaza un comprobante que no es JPG, PNG ni PDF', async () => {
        const componente = (await montar()).componentInstance;

        const campo = { files: [new File(['x'], 'nota.txt', { type: 'text/plain' })], value: 'x' };
        componente.elegirComprobante({ target: campo } as unknown as Event);

        expect(componente.errorArchivo()).toContain('JPG o PNG');
        expect(componente.comprobante()).toBeNull();
    });

    it('acepta un PDF y lo marca como recibido', async () => {
        const componente = (await montar()).componentInstance;

        const campo = { files: [new File(['x'], 'pago.pdf', { type: 'application/pdf' })], value: 'x' };
        componente.elegirComprobante({ target: campo } as unknown as Event);

        expect(componente.errorArchivo()).toBe('');
        expect(componente.comprobante()?.nombre).toBe('pago.pdf');
    });
});
