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
