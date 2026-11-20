import { TestBed } from '@angular/core/testing';
import { SEGUIMIENTO_API } from '../../../../testing/pedido-api';
import { EstadoVisible } from '../../../dominio/interfaces/seguimiento';
import { Seguimiento } from './seguimiento';

async function montar(estado: EstadoVisible) {
    const fixture = TestBed.createComponent(Seguimiento);
    fixture.componentRef.setInput('pedido', { ...SEGUIMIENTO_API, visible_status: estado });
    await fixture.whenStable();
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('ol.pasos li'))
        .map(li => li.querySelector('i')!.classList.contains('bi-check-circle-fill'));
}

describe('Seguimiento: pasos con visto', () => {
    it('confirmado: el paso actual usa su propio icono, no el visto', async () => expect(await montar('confirmado')).toEqual([false, false, false]));
    it('en producción: solo «Confirmado» lleva visto', async () => expect(await montar('en_produccion')).toEqual([true, false, false]));
    it('enviado: los tres, porque no existe «Entregado»', async () => expect(await montar('enviado')).toEqual([true, true, true]));
});

describe('Seguimiento: guía de envío', () => {
    async function conGuia(url: string | null) {
        const fixture = TestBed.createComponent(Seguimiento);
        fixture.componentRef.setInput('pedido', {
            ...SEGUIMIENTO_API, visible_status: 'enviado',
            shipment: { carrier: 'Servientrega', tracking_number: '1234567890', tracking_url: url },
        });
        await fixture.whenStable();
        return fixture.nativeElement as HTMLElement;
    }

    it('con guía muestra el enlace a Servientrega (en otra pestaña y sin referer)', async () => {
        const a = (await conGuia('https://www.servientrega.com.ec/')).querySelector<HTMLAnchorElement>('a.btn-primario');

        expect(a?.getAttribute('href')).toBe('https://www.servientrega.com.ec/');
        expect(a?.getAttribute('target')).toBe('_blank');
        expect(a?.getAttribute('rel')).toContain('noopener');
        expect(a?.textContent).toContain('Rastrear en Servientrega');
    });

    it('sin enlace configurado muestra la guía pero no el botón', async () => {
        const el = await conGuia(null);

        expect(el.textContent).toContain('1234567890');
        expect(el.querySelector('a.btn-primario')).toBeNull();
    });

    it('sin guía todavía no hay enlace', async () => {
        const fixture = TestBed.createComponent(Seguimiento);
        fixture.componentRef.setInput('pedido', SEGUIMIENTO_API);
        await fixture.whenStable();

        expect((fixture.nativeElement as HTMLElement).querySelector('a.btn-primario')).toBeNull();
    });
});
