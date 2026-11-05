import { TestBed } from '@angular/core/testing';
import { Politica } from './politica';
import { CAPITULOS_TERMINOS } from '../../../aplicacion/servicios/terminos-contenido';

async function montar() {
    TestBed.configureTestingModule({ imports: [Politica] });
    const f = TestBed.createComponent(Politica);
    await f.whenStable();
    return { html: f.nativeElement as HTMLElement, componente: f.componentInstance };
}

describe('Términos y condiciones', () => {
    it('muestra el título y los 10 capítulos del texto oficial', async () => {
        const { html } = await montar();

        expect(html.querySelector('h1')?.textContent).toBe('Términos y condiciones de Jardín de Sele');
        expect(CAPITULOS_TERMINOS.length).toBe(10);
        expect(html.querySelectorAll('h2').length).toBe(10);
        expect(html.querySelector('h2')?.textContent).toContain('Capítulo 1. Información del vendedor');
        expect(html.textContent).toContain('RUC 0930247994001');
        expect(html.textContent).toContain('ayuda@jardindesele.com');
    });

    it('dibuja las cláusulas con su número, la negrita y las listas', async () => {
        const { html } = await montar();

        expect(html.textContent).toContain('5.6 Fechas de eventos y demoras.');
        expect(Array.from(html.querySelectorAll('b')).some(b => b.textContent?.includes('en especial en la posición'))).toBe(true);
        expect(html.querySelectorAll('li').length).toBe(4);       // 2 canales de atención + 2 reembolsos del 7.1
        expect(html.textContent).not.toContain('**');
    });

    it('sin versión ni fecha de Laravel no muestra la línea de versión', async () => {
        const { html } = await montar();

        expect(html.querySelector('.version')).toBeNull();
    });
});
