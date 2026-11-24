import { describe, expect, it } from 'vitest';
import { PedidoAdmin } from '../../dominio/interfaces/pedidos-admin';
import { construirPdf, datosDeEtiqueta, partirEnLineas } from './EtiquetaEnvio';

const pedido = {
    number: 'JDS-1017', tracking_number: null,
    customer: { name: 'Comprador', email: 'comprador@correo.com', phone: '0990000000' },
    shipping: { name: 'Josué de Santis', id_number: '0930247994', phone: '0991112233', email: 'recibe@correo.com', address: 'Cdla. Ejemplo, Mz 4 Villa 12', reference: 'Frente al parque', province_name: 'Guayas', canton_name: 'Durán' },
} as PedidoAdmin;

describe('EtiquetaEnvio', () => {
    it('la etiqueta lleva los datos de quien recibe, con provincia, cantón, referencia y correo', () => {
        const d = datosDeEtiqueta(pedido, '27 nov – 28 nov');

        expect(d).toMatchObject({ numero: 'JDS-1017', destinatario: 'Josué de Santis', celular: '0991112233', correo: 'recibe@correo.com', provincia: 'Guayas', canton: 'Durán', referencia: 'Frente al parque', entrega: '27 nov – 28 nov', guia: '' });
    });

    it('si el envío no trae correo usa el del comprador', () => {
        const d = datosDeEtiqueta({ ...pedido, shipping: { ...pedido.shipping, email: '' } }, '');
        expect(d.correo).toBe('comprador@correo.com');
    });

    it('parte el texto en renglones y recorta con «…» al pasar el máximo', () => {
        const medir = (t: string) => t.length * 10;
        expect(partirEnLineas('uno dos tres cuatro', 90, medir, 3)).toEqual(['uno dos', 'tres', 'cuatro']);
        const recortado = partirEnLineas('uno dos tres cuatro cinco seis', 70, medir, 2);
        expect(recortado).toHaveLength(2);
        expect(recortado[1].endsWith('…')).toBe(true);
    });

    it('construye un PDF válido de una página con la imagen incluida y tabla de referencias correcta', () => {
        const jpeg = new Uint8Array([0xff, 0xd8, 1, 2, 3, 0xff, 0xd9]);
        const pdf = construirPdf(jpeg, 1181, 787);
        const texto = new TextDecoder('latin1').decode(pdf);

        expect(texto.startsWith('%PDF-1.4')).toBe(true);
        expect(texto).toContain('/Filter /DCTDecode');
        expect(texto).toContain('/Width 1181 /Height 787');
        expect(texto.trimEnd().endsWith('%%EOF')).toBe(true);
        const inicio = Number(/startxref\n(\d+)/.exec(texto)![1]);
        expect(texto.slice(inicio, inicio + 4)).toBe('xref');
        const entradas = texto.slice(inicio).split('\n').slice(2, 8);   // la 0 es la libre; de la 1 a la 5, los objetos
        for (const n of [1, 2, 3, 4, 5]) {
            const off = Number(entradas[n].slice(0, 10));
            expect(texto.slice(off, off + `${n} 0 obj`.length)).toBe(`${n} 0 obj`);
        }
    });
});
