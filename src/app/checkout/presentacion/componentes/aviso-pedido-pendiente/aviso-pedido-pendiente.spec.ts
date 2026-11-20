import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { PENDIENTE_API, SEGUIMIENTO_API } from '../../../../testing/pedido-api';
import { AvisoPedidoPendiente } from './aviso-pedido-pendiente';

const token = 'x'.repeat(64);

async function montar(url: string, respuesta: { cuerpo: object; status?: number } | null) {
    localStorage.setItem('jds_pedido_pendiente', JSON.stringify({ numero: 'JDS-48213', token, guardado: new Date().toISOString() }));
    TestBed.configureTestingModule({
        imports: [AvisoPedidoPendiente],
        providers: [provideRouter([{ path: '**', children: [] }]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }],
    });
    await TestBed.inject(Router).navigateByUrl(url);
    const fixture = TestBed.createComponent(AvisoPedidoPendiente);
    await fixture.whenStable();
    const http = TestBed.inject(HttpTestingController);
    if (respuesta) {
        http.expectOne(`/api/v1/orders/${token}`).flush(respuesta.cuerpo, { status: respuesta.status ?? 200, statusText: 'x' });
        await fixture.whenStable();
        fixture.detectChanges();
    } else {
        http.expectNone(() => true);
    }
    return fixture.nativeElement as HTMLElement;
}

describe('AvisoPedidoPendiente', () => {
    beforeEach(() => localStorage.clear());

    it('pendiente de pago: avisa y enlaza a /pedido/{token}', async () => {
        const el = await montar('/categorias', { cuerpo: PENDIENTE_API });

        expect(el.textContent).toContain('JDS-48213');
        expect(el.textContent).toContain('pendiente de pago');
        expect(el.querySelector('a')?.getAttribute('href')).toBe(`/pedido/${token}`);
    });

    it('con comprobante subido dice "comprobante en revisión"', async () => {
        const el = await montar('/', { cuerpo: { ...PENDIENTE_API, receipt: { uploaded: true } } });

        expect(el.textContent).toContain('comprobante en revisión');
    });

    it('pedido pagado: muestra en qué estado va (en producción, enviado)', async () => {
        expect((await montar('/', { cuerpo: { ...SEGUIMIENTO_API, visible_status: 'en_produccion' } })).textContent).toContain('en producción');
        TestBed.resetTestingModule();
        expect((await montar('/', { cuerpo: { ...SEGUIMIENTO_API, visible_status: 'enviado' } })).textContent).toContain('enviado');
    });

    it('si el pedido venció, se canceló o no existe, el aviso se borra', async () => {
        expect((await montar('/', { cuerpo: { ...PENDIENTE_API, status: 'expired' } })).textContent?.trim()).toBe('');
        expect(localStorage.getItem('jds_pedido_pendiente')).toBeNull();

        TestBed.resetTestingModule();
        expect((await montar('/', { cuerpo: { code: 'not_found', message: 'x' }, status: 404 })).textContent?.trim()).toBe('');
        expect(localStorage.getItem('jds_pedido_pendiente')).toBeNull();
    });

    it('no aparece dentro del propio pedido ni en la confirmación', async () => {
        expect((await montar(`/pedido/${token}`, { cuerpo: PENDIENTE_API })).textContent?.trim()).toBe('');
        TestBed.resetTestingModule();
        expect((await montar('/checkout/confirmacion', { cuerpo: PENDIENTE_API })).textContent?.trim()).toBe('');
    });
});
