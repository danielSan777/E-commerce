import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { PENDIENTE_API, TOKEN_PRUEBA } from '../../../../testing/pedido-api';
import { PedidoPendiente } from './pedido-pendiente';

async function montar(vista = PENDIENTE_API) {
    TestBed.configureTestingModule({
        imports: [PedidoPendiente],
        providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }],
    });
    const fixture = TestBed.createComponent(PedidoPendiente);
    fixture.componentRef.setInput('vista', vista);
    fixture.componentRef.setInput('token', TOKEN_PRUEBA);
    await fixture.whenStable();
    return fixture;
}

const elegir = (fixture: ComponentFixture<PedidoPendiente>, archivo: File) =>
    fixture.componentInstance.elegirComprobante({ target: { files: [archivo], value: 'x' } } as unknown as Event);

describe('PedidoPendiente (/pedido/{token})', () => {
    it('muestra número, plazo, cuentas de Laravel, enlace de WhatsApp y el aviso de que no se edita', async () => {
        const fixture = await montar();
        const el: HTMLElement = fixture.nativeElement;

        expect(el.textContent).toContain('JDS-48213');
        expect(el.textContent).toContain('Paga antes del martes 3 de noviembre, 23:00');
        expect(el.textContent).toContain('JOSUE DE SANTIS');
        expect(el.textContent).toContain('Banco Nuevo Andino');
        expect(el.textContent).toContain('Subir comprobante');
        expect(el.textContent).toContain('ya no se puede editar');
        expect(el.textContent).not.toContain('Modo de prueba');
        expect(el.querySelector<HTMLAnchorElement>('a.btn-whatsapp')?.getAttribute('href')).toBe(PENDIENTE_API.whatsapp_url);
    });

    it('un pedido vencido invita a volver a comprar y no muestra las cuentas', async () => {
        const el: HTMLElement = (await montar({ ...PENDIENTE_API, status: 'expired' })).nativeElement;

        expect(el.textContent).toContain('Pedido vencido');
        expect(el.textContent).not.toContain('Datos para tu transferencia');
    });

    it('rechaza un comprobante que no es JPG, PNG ni PDF sin llamar a Laravel', async () => {
        const fixture = await montar();
        const http = TestBed.inject(HttpTestingController);
        elegir(fixture, new File(['x'], 'nota.txt', { type: 'text/plain' }));

        expect(fixture.componentInstance.errorArchivo()).toContain('JPG o PNG');
        http.expectNone(() => true);
    });

    it('rechaza un comprobante de más de 5 MB', async () => {
        const fixture = await montar();
        elegir(fixture, new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'grande.pdf', { type: 'application/pdf' }));

        expect(fixture.componentInstance.errorArchivo()).toContain('5 MB');
    });

    it('sube un PDF a Laravel y avisa con el pedido actualizado', async () => {
        const fixture = await montar();
        const http = TestBed.inject(HttpTestingController);
        const recibido: unknown[] = [];
        fixture.componentInstance.actualizada.subscribe(v => recibido.push(v));

        elegir(fixture, new File(['x'], 'pago.pdf', { type: 'application/pdf' }));
        const actualizado = { ...PENDIENTE_API, receipt: { uploaded: true } };
        http.expectOne(`/api/v1/orders/${TOKEN_PRUEBA}/receipt`).flush(actualizado);

        expect(recibido).toEqual([actualizado]);
        expect(fixture.componentInstance.errorArchivo()).toBe('');
    });

    it('si Laravel rechaza el archivo muestra su mensaje', async () => {
        const fixture = await montar();
        const http = TestBed.inject(HttpTestingController);

        elegir(fixture, new File(['x'], 'pago.png', { type: 'image/png' }));
        http.expectOne(`/api/v1/orders/${TOKEN_PRUEBA}/receipt`).flush(
            { code: 'validation_error', message: 'Datos inválidos.', errors: { receipt: ['El comprobante no puede pesar más de 5 MB.'] } },
            { status: 422, statusText: 'Unprocessable' });

        expect(fixture.componentInstance.errorArchivo()).toBe('El comprobante no puede pesar más de 5 MB.');
        expect(fixture.componentInstance.subiendo()).toBe(false);
    });

    it('con comprobante recibido muestra "Comprobante en revisión"', async () => {
        const el: HTMLElement = (await montar({ ...PENDIENTE_API, receipt: { uploaded: true } })).nativeElement;

        expect(el.textContent).toContain('Comprobante en revisión');
        expect(el.textContent).toContain('Cambiar comprobante');
    });
});
