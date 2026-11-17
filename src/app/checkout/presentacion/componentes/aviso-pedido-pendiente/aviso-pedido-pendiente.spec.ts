import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { PedidoPendienteRecordadoService } from '../../../aplicacion/servicios/PedidoPendienteRecordadoService';
import { AvisoPedidoPendiente } from './aviso-pedido-pendiente';

const token = 'x'.repeat(64);

async function montar(url = '/') {
    localStorage.setItem('jds_pedido_pendiente', JSON.stringify({ numero: 'JDS-48213', token, vence: new Date(Date.now() + 3600_000).toISOString() }));
    TestBed.configureTestingModule({
        imports: [AvisoPedidoPendiente],
        providers: [provideRouter([{ path: '**', children: [] }])],
    });
    await TestBed.inject(Router).navigateByUrl(url);
    const fixture = TestBed.createComponent(AvisoPedidoPendiente);
    await fixture.whenStable();
    return fixture;
}

describe('AvisoPedidoPendiente', () => {
    beforeEach(() => localStorage.clear());

    it('en la tienda avisa del pedido pendiente y enlaza a /pedido/{token}', async () => {
        const el: HTMLElement = (await montar('/categorias')).nativeElement;

        expect(el.textContent).toContain('JDS-48213');
        expect(el.querySelector('a')?.getAttribute('href')).toBe(`/pedido/${token}`);
    });

    it('no aparece dentro del propio pedido ni en la confirmación', async () => {
        expect(((await montar(`/pedido/${token}`)).nativeElement as HTMLElement).textContent?.trim()).toBe('');
        TestBed.resetTestingModule();
        expect(((await montar('/checkout/confirmacion')).nativeElement as HTMLElement).textContent?.trim()).toBe('');
    });

    it('sin pedido recordado no muestra nada', async () => {
        const fixture = await montar();
        TestBed.inject(PedidoPendienteRecordadoService).olvidar();
        fixture.detectChanges();

        expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('');
    });
});
