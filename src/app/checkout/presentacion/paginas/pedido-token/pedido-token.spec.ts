import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { API_URL } from '../../../../core/configuracion/api';
import { PENDIENTE_API, SEGUIMIENTO_API, TOKEN_PRUEBA } from '../../../../testing/pedido-api';
import { PedidoToken } from './pedido-token';

async function montar(respuesta: { cuerpo: object; status?: number }) {
    TestBed.configureTestingModule({
        imports: [PedidoToken],
        providers: [
            provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' },
            { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => TOKEN_PRUEBA } } } },
        ],
    });
    const fixture = TestBed.createComponent(PedidoToken);
    TestBed.inject(HttpTestingController).expectOne(`/api/v1/orders/${TOKEN_PRUEBA}`)
        .flush(respuesta.cuerpo, { status: respuesta.status ?? 200, statusText: 'x' });
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
}

describe('PedidoToken (/pedido/{token})', () => {
    it('pedido pagado: muestra el seguimiento con el estado, la ventana y el nombre', async () => {
        const html = await montar({ cuerpo: SEGUIMIENTO_API });

        expect(html.textContent).toContain('Confirmado');
        expect(html.textContent).toContain('Del 12 al 13 de noviembre');
        expect(html.textContent).toContain('Josué de Santis');
        expect(html.textContent).toContain('Servientrega');
        expect(html.textContent).not.toContain('Entregado');
    });

    it('transferencia sin pagar: muestra el pedido pendiente', async () => {
        const html = await montar({ cuerpo: PENDIENTE_API });

        expect(html.textContent).toContain('Pendiente de pago');
        expect(html.textContent).not.toContain('Estado de tu pedido');
    });

    it('un pedido ya pagado o vencido deja de recordarse como pendiente', async () => {
        localStorage.setItem('jds_pedido_pendiente', '{"numero":"JDS-1","token":"t","vence":"2099-01-01T00:00:00Z"}');
        await montar({ cuerpo: SEGUIMIENTO_API });

        expect(localStorage.getItem('jds_pedido_pendiente')).toBeNull();
    });

    it('token desconocido: 404', async () => {
        const html = await montar({ cuerpo: { code: 'not_found', message: 'No encontramos ese pedido.' }, status: 404 });

        expect(html.textContent).toContain('404');
        expect(html.textContent).not.toContain('JDS-');
    });

    it('falla de red: avisa y ofrece reintentar (no confunde con un 404)', async () => {
        const html = await montar({ cuerpo: { code: 'server_error', message: 'x' }, status: 500 });

        expect(html.textContent).toContain('No pudimos cargar tu pedido');
        expect(html.textContent).not.toContain('404');
    });

    it('pone la vista previa para WhatsApp (og:title, og:description, og:image) y no se indexa', async () => {
        await montar({ cuerpo: PENDIENTE_API });
        const meta = TestBed.inject(Meta);
        const contenido = (selector: string) => meta.getTag(selector)?.content;

        expect(contenido("property='og:title'")).toBe(PENDIENTE_API.share.title);
        expect(contenido("property='og:description'")).toBe(PENDIENTE_API.share.description);
        expect(contenido("property='og:image'")).toBe(PENDIENTE_API.share.image);
        expect(contenido("name='robots'")).toBe('noindex, nofollow');
    });
});
