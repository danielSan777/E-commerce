import { TestBed } from '@angular/core/testing';
import { CarritoService, ItemCarrito } from './CarritoService';

type Capa = { event: string; items?: { item_id: string; item_name: string }[] };

describe('CarritoService: evento add_to_cart', () => {
    const capa = () => (window as unknown as { dataLayer: Capa[] }).dataLayer;
    const item = (uid: string, producto: Partial<ItemCarrito['producto']>): ItemCarrito => ({
        uid, tipo: 'personalizado', producto: { id: 'doctor', nombre: 'Doctor', precio: 20, ...producto }, vista: '', ruta: '', resumen: [],
    });

    beforeEach(() => {
        localStorage.clear();
        (window as unknown as { dataLayer?: Capa[] }).dataLayer = [];
        TestBed.configureTestingModule({});
    });

    it('manda el SKU del producto, el mismo código que usa el servidor en la compra', () => {
        TestBed.inject(CarritoService).guardar(item('a', { sku: 'JDS-005' }));

        expect(capa()).toEqual([{ event: 'add_to_cart', items: [{ item_id: 'JDS-005', item_name: 'Doctor' }] }]);
    });

    it('sin SKU (un carrito guardado antes) usa el id, y editar una línea que ya estaba no vuelve a medirla', () => {
        const carrito = TestBed.inject(CarritoService);
        carrito.guardar(item('a', {}));
        carrito.guardar(item('a', {}));   // mismo uid: se está editando

        expect(capa()).toEqual([{ event: 'add_to_cart', items: [{ item_id: 'doctor', item_name: 'Doctor' }] }]);
    });
});
