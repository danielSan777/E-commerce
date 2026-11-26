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

describe('Atribución · identificadores de las plataformas', () => {
    beforeEach(() => localStorage.clear());

    it('saca client_id y session_id de GA4, y fbp y ttp, de las cookies', () => {
        const ids = TestBed.inject(AtribucionService).identificadores(
            '_ga=GA1.1.1234567890.1700000000; _ga_5D09M0XBQ6=GS2.1.s1700001111$o1$g1$t1700001200; _fbp=fb.1.1700000000000.99887766; _ttp=tt-abc; otra=1');

        expect(ids['ga_client_id']).toBe('1234567890.1700000000');
        expect(ids['ga_session_id']).toBe('1700001111');
        expect(ids['fbp']).toBe('fb.1.1700000000000.99887766');
        expect(ids['ttp']).toBe('tt-abc');
    });

    it('con el formato anterior de la cookie de sesión también saca el session_id', () => {
        const ids = TestBed.inject(AtribucionService).identificadores('_ga=GA1.2.55.66; _ga_ABC=GS1.1.1700002222.3.1.1700002300.0.0.0');
        expect(ids['ga_client_id']).toBe('55.66');
        expect(ids['ga_session_id']).toBe('1700002222');
    });

    it('sin cookies todo va en null, y sin _fbc pero con fbclid arma el fbc con el formato de Meta', () => {
        const a = TestBed.inject(AtribucionService);
        expect(Object.values(a.identificadores('')).every(v => v === null)).toBe(true);

        const toque = a.armarToque('https://jardindesele.com/?fbclid=IwAR123', '?fbclid=IwAR123');
        localStorage.setItem('jds_atribucion', JSON.stringify({ first_touch: toque, last_touch: toque }));
        expect(a.identificadores('')['fbc']).toBe(`fb.1.${new Date(toque.date).getTime()}.IwAR123`);
        expect(a.identificadores('_fbc=fb.1.1.propio')['fbc']).toBe('fb.1.1.propio');
    });
});

describe('AnalyticsService.track', () => {
    it('empuja el evento al dataLayer con su nombre y parámetros', () => {
        (window as unknown as { dataLayer: unknown[] }).dataLayer = [];
        TestBed.inject(AnalyticsService).track('view_item', { items: [{ item_id: 'doctor' }] });

        expect((window as unknown as { dataLayer: unknown[] }).dataLayer).toEqual([{ event: 'view_item', items: [{ item_id: 'doctor' }] }]);
    });
});
