import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { CalendarioVentanas } from './calendario-ventanas';
import { PromesaService } from '../../../checkout/aplicacion/servicios/PromesaService';
import { VentanaDisponible } from '../../../checkout/dominio/interfaces/promesa';

@Component({
    imports: [CalendarioVentanas],
    template: `<app-calendario-ventanas [ventanas]="ventanas" [elegida]="elegida" (elegir)="elegida = $event" />`,
})
class Anfitrion {
    ventanas = new PromesaService().ventanas().windows;
    elegida: VentanaDisponible | undefined;
}

describe('CalendarioVentanas', () => {
    async function montar() {
        const fixture = TestBed.createComponent(Anfitrion);
        await fixture.whenStable();
        return fixture;
    }
    const botones = (f: any, estado: string) =>
        Array.from((f.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(`.dia.${estado}`));

    it('dibuja noviembre y habilita solo los días que están en una ventana disponible', async () => {
        const f = await montar();
        const libres = botones(f, 'libre').map(b => b.textContent!.trim());

        expect(libres).toContain('12');
        expect(libres).toContain('13');
        expect(libres).not.toContain('15');          // domingo
        expect(botones(f, 'lleno').map(b => b.textContent!.trim())).toEqual(['17', '18']);
    });

    it('tocar un día marca los 2 días de su ventana', async () => {
        const f = await montar();
        botones(f, 'libre').find(b => b.textContent!.trim() === '19')!.click();
        await f.whenStable();

        expect(botones(f, 'marcado').map(b => b.textContent!.trim())).toEqual(['19', '20']);
        expect(f.componentInstance.elegida).toEqual({ start: '2026-11-19', end: '2026-11-20', available: true });
    });

    it('el sábado se junta con el lunes (domingo no cuenta)', async () => {
        const f = await montar();
        botones(f, 'libre').find(b => b.textContent!.trim() === '14')!.click();
        await f.whenStable();

        expect(botones(f, 'marcado').map(b => b.textContent!.trim())).toEqual(['14', '16']);
        expect((f.nativeElement as HTMLElement).querySelector('.resumen')?.textContent).toContain('sábado 14 y lunes 16 de noviembre');
    });

    it('un día de una ventana no disponible no se puede elegir', async () => {
        const f = await montar();
        botones(f, 'lleno')[0].click();
        await f.whenStable();

        expect(f.componentInstance.elegida).toBeUndefined();
    });
});
