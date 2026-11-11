import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CampanaBanner } from './campana-banner';

@Component({
    imports: [CampanaBanner],
    template: `<app-campana-banner nombre="San Valentín" [lema]="lema" frase="Regala amor" emoji="💘" [color]="color" [enlace]="enlace" [video]="video" [cierre]="cierre" />`,
})
class Anfitrion {
    lema: string | null = 'Un regalo para tu amor';
    color: string | null = '#c2185b';
    enlace: string | null = '/san-valentin';
    video: string | null = null;
    cierre: string | null = null;
}

describe('CampanaBanner', () => {
    function montar(ajustes: Partial<Anfitrion> = {}) {
        TestBed.configureTestingModule({ providers: [provideRouter([])] });
        const fixture = TestBed.createComponent(Anfitrion);
        Object.assign(fixture.componentInstance, ajustes);
        fixture.detectChanges();
        return fixture.nativeElement as HTMLElement;
    }

    it('muestra nombre, lema, frase y un enlace a la campaña', () => {
        const html = montar();
        expect(html.textContent).toContain('San Valentín');
        expect(html.querySelector('h2')?.textContent).toContain('Un regalo para tu amor');
        expect(html.querySelector('.campana-frase')?.textContent).toContain('Regala amor');
        expect(html.querySelector('a')?.getAttribute('href')).toBe('/san-valentin');
    });

    it('sin enlace (vista previa) el botón no es un enlace', () => {
        const html = montar({ enlace: null });
        expect(html.querySelector('a')).toBeNull();
        expect(html.querySelector('span.boton')).not.toBeNull();
    });

    it('con mensaje de cierre lo muestra sin lema ni botón', () => {
        const html = montar({ cierre: 'San Valentín regresará pronto' });
        expect(html.querySelector('h2')?.textContent).toContain('San Valentín regresará pronto');
        expect(html.querySelector('.campana-frase')).toBeNull();
        expect(html.querySelector('.boton')).toBeNull();
    });

    it('el video tiene prioridad sobre el emoji', () => {
        const html = montar({ video: 'http://x/v.mp4' });
        expect(html.querySelector('video.campana-portada')).not.toBeNull();
        expect(html.querySelector('.campana-emoji')).toBeNull();
    });

    it('ignora un color que no sea #RRGGBB', () => {
        const html = montar({ color: 'red; background:url(x)' });
        expect((html.querySelector('.campana') as HTMLElement).style.getPropertyValue('--campana')).toBe('');
    });
});
