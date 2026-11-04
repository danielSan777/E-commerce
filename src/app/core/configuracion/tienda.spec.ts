import { TIENDA, enlaceWhatsapp } from './tienda';

describe('datos de la tienda', () => {
    it('el enlace de WhatsApp usa el número y codifica el texto', () => {
        expect(enlaceWhatsapp('Hola 🌿')).toBe(`https://wa.me/${TIENDA.whatsapp}?text=${encodeURIComponent('Hola 🌿')}`);
    });

    it('el número de WhatsApp son solo dígitos', () => {
        expect(TIENDA.whatsapp).toMatch(/^\d+$/);
    });
});
