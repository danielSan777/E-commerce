import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConsultarPedido } from './consultar-pedido';
import { MENSAJE_CONSULTA } from '../../../aplicacion/servicios/ConsultaPedidoService';

async function montar() {
    TestBed.configureTestingModule({ imports: [ConsultarPedido], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ConsultarPedido);
    await fixture.whenStable();
    return fixture;
}

describe('ConsultarPedido', () => {
    it('sin número o con correo inválido pide corregir y no envía', async () => {
        const f = await montar();
        const c = f.componentInstance;

        c.numero = ''; c.correo = 'a@b.com';
        c.enviar(new Event('submit'));
        expect(c.errores().numero).toContain('número de pedido');
        expect(TestBed.inject(AvisosService).lista().at(-1)?.texto).toContain('Faltan datos o hay datos incorrectos');

        c.numero = 'JDS-1'; c.correo = 'correo-malo';
        c.enviar(new Event('submit'));
        expect(c.errores().correo).toContain('correo válido');
        expect(c.errores().numero).toBeUndefined();
        expect(c.respuesta()).toBe('');
    });

    it('con datos válidos responde siempre el mismo mensaje y no muestra datos del pedido', async () => {
        const f = await montar();
        const c = f.componentInstance;

        c.numero = 'JDS-1'; c.correo = 'a@b.com';
        await c.enviar(new Event('submit'));
        const primero = c.respuesta();
        c.numero = 'NO-EXISTE'; c.correo = 'otro@b.com';
        await c.enviar(new Event('submit'));

        expect(primero).toBe(MENSAJE_CONSULTA);
        expect(c.respuesta()).toBe(primero);
        expect(c.error()).toBe('');
    });
});
