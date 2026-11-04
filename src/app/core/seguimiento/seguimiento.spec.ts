import { TestBed } from '@angular/core/testing';
import { AnalyticsService } from './AnalyticsService';
import { AtribucionService } from './AtribucionService';

describe('Atribución', () => {
    beforeEach(() => { localStorage.clear(); TestBed.configureTestingModule({}); });

    it('lee UTMs, fbclid y ttclid de la dirección', () => {
        const t = TestBed.inject(AtribucionService).armarToque('https://x.com/?a=1', '?utm_source=meta&utm_medium=paid&utm_campaign=sv&utm_content=123&fbclid=ABC&ttclid=TT');

        expect(t.utm).toEqual({ source: 'meta', medium: 'paid', campaign: 'sv', content: '123', term: null });
        expect(t.fbclid).toBe('ABC');
        expect(t.ttclid).toBe('TT');
    });

    it('el primer toque no se sobrescribe y el último solo cambia si llega con campaña', () => {
        const s = TestBed.inject(AtribucionService);
        const guardar = (search: string) => {
            const actual = s.armarToque('https://x.com/' + search, search);
            localStorage.setItem('jds_atribucion', JSON.stringify({
                first_touch: s.first() ?? actual,
                last_touch: actual.utm.source ? actual : (s.last() ?? actual),
            }));
        };
        guardar('?utm_source=meta');
        guardar('');                       // visita directa: no cambia nada
        guardar('?utm_source=tiktok');

        expect(s.first()?.utm.source).toBe('meta');
        expect(s.last()?.utm.source).toBe('tiktok');
    });

    it('capturar() guarda el primer toque de la visita actual', () => {
        const s = TestBed.inject(AtribucionService);
        s.capturar();

        expect(s.first()?.landing_url).toContain('http');
        expect(s.last()).not.toBeNull();
    });
});

describe('AnalyticsService.track', () => {
    it('empuja el evento al dataLayer con su nombre y parámetros', () => {
        (window as unknown as { dataLayer: unknown[] }).dataLayer = [];
        TestBed.inject(AnalyticsService).track('view_item', { items: [{ item_id: 'doctor' }] });

        expect((window as unknown as { dataLayer: unknown[] }).dataLayer).toEqual([{ event: 'view_item', items: [{ item_id: 'doctor' }] }]);
    });
});
