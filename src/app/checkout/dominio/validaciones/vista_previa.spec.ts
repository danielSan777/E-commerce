import { etiquetasDeVistaPrevia } from './vista_previa';

describe('etiquetasDeVistaPrevia (tarjeta de WhatsApp)', () => {
    const v = { title: 'Pedido JDS-1 · Jardín de Sele', description: 'Doctor · Total $28.50', image: 'https://api.test/preview' };

    it('incluye título, descripción e imagen en Open Graph y Twitter', () => {
        const e = etiquetasDeVistaPrevia(v);
        const valor = (clave: string) => e.find(t => t.property === clave || t.name === clave)?.content;

        expect(valor('og:title')).toBe(v.title);
        expect(valor('og:description')).toBe(v.description);
        expect(valor('og:image')).toBe(v.image);
        expect(valor('twitter:card')).toBe('summary_large_image');
    });

    it('sin foto no pone og:image y la tarjeta es pequeña', () => {
        const e = etiquetasDeVistaPrevia({ ...v, image: null });

        expect(e.some(t => t.property === 'og:image')).toBe(false);
        expect(e.find(t => t.name === 'twitter:card')?.content).toBe('summary');
    });

    it('no lleva datos personales', () => {
        expect(JSON.stringify(etiquetasDeVistaPrevia(v))).not.toMatch(/@|0930|Av\./);
    });
});
