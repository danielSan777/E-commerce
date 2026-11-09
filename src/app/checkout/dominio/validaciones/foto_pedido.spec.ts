import { ItemCarrito } from '../../../carrito/aplicacion/servicios/CarritoService';
import { itemsConFoto, nombreArchivoFoto } from './foto_pedido';

const item = (nombre: string, vista: string) => ({ uid: nombre, producto: { nombre }, vista }) as unknown as ItemCarrito;

describe('foto del pedido', () => {
    it('solo cuenta los productos que tienen la foto personalizada', () => {
        const lista = [item('A', 'data:image/jpeg;base64,xx'), item('B', ''), item('C', 'https://x.com/a.jpg')];
        expect(itemsConFoto(lista).map(i => i.uid)).toEqual(['A']);
    });

    it('arma el nombre del archivo sin tildes, espacios ni símbolos', () => {
        expect(nombreArchivoFoto('JDS-25989', item('Amigo guitarrista', 'data:image/jpeg;base64,x'), 1))
            .toBe('jardin-de-sele-JDS-25989-amigo-guitarrista.jpg');
        expect(nombreArchivoFoto('JDS-1', item('¡Mamá Doctora!', 'data:image/png;base64,x'), 2))
            .toBe('jardin-de-sele-JDS-1-mama-doctora-2.png');
        expect(nombreArchivoFoto('JDS-1', item('***', 'data:image/jpeg;base64,x'), 1)).toBe('jardin-de-sele-JDS-1-producto.jpg');
    });
});
