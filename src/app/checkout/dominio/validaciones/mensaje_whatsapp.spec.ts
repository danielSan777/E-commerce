import { Pedido } from '../../aplicacion/servicios/PedidoService';
import { ItemCarrito } from '../../../carrito/aplicacion/servicios/CarritoService';
import { mensajeComprobante, urlWhatsapp } from './mensaje_whatsapp';

function pedidoDePrueba(): Pedido {
    const item: ItemCarrito = {
        uid: 'a1',
        tipo: 'personalizado',
        producto: { id: '1', nombre: 'Maceta Doctor', precio: 25, imagen: '' },
        vista: '',
        ruta: '',
        resumen: [
            { icono: 'bi-person', etiqueta: 'Nombre', valor: 'Josué' },
            { icono: 'bi-card-text', etiqueta: 'Tarjeta de dedicatoria', valor: '«Gracias por todo»' },
        ],
    };

    return {
        numero: 'JDS-48213',
        fecha: '2026-11-03T16:00:00.000Z',
        metodo: 'transferencia',
        pagoConfirmado: false,
        pagoSimulado: false,
        limitePago: '2026-11-04T04:00:00.000Z',
        entrega: { tipo: 'inmediata', window: { start: '2026-11-12', end: '2026-11-13' }, label: 'Recíbelo entre jueves 12 y viernes 13 de noviembre', promise_token: 'firmado-por-laravel' },
        marketing: false,
        items: [item],
        datos: {
            nombre: 'María Pérez', tipoDoc: 'cedula', cedula: '0954091989', celular: '0991234567',
            correo: 'maria@correo.com', provincia: 'Guayas', canton: 'Durán', direccion: 'Av. Principal 123', referencia: '',
            facturacion: 'mismos',
            fNombre: '', fTipoDoc: 'cedula', fCedula: '', fCelular: '', fCorreo: '', fProvincia: '', fCanton: '', fDireccion: '',
            contacto: 'mismo', contactoNumero: '',
            metodoPago: 'transferencia',
            entrega: 'inmediata', ventanaInicio: '', ventanaFin: '',
        },
        subtotal: 25, envio: 3.5, envioGratis: false, recargo: 0, total: 28.5,
    };
}

describe('mensaje de WhatsApp del comprobante', () => {
    it('empieza con el saludo, el número de pedido y el total', () => {
        const texto = mensajeComprobante(pedidoDePrueba());

        expect(texto).toContain('Hola 🌿 Te envío el comprobante de mi pedido JDS-48213.');
        expect(texto).toContain('$28.50');
        expect(texto).toContain('Maceta Doctor');
    });

    it('no lleva datos personales, dirección ni promesas de enviar algo después', () => {
        const texto = mensajeComprobante(pedidoDePrueba());

        for (const privado of ['María', '0954091989', '0991234567', 'maria@correo.com', 'Av. Principal', 'Durán']) {
            expect(texto).not.toContain(privado);
        }
        expect(texto).not.toContain('Te enviaré por aquí');
    });

    it('con más de 3 productos lista solo 3 y avisa cuántos faltan', () => {
        const p = pedidoDePrueba();
        p.items = [1, 2, 3, 4, 5].map(n => ({ ...p.items[0], uid: `u${n}`, producto: { ...p.items[0].producto, nombre: `Maceta ${n}` } }));

        const texto = mensajeComprobante(p);

        expect(texto).toContain('Maceta 3');
        expect(texto).not.toContain('Maceta 4');
        expect(texto).toContain('y 2 más');
    });

    it('la urlWhatsapp lleva el mensaje codificado', () => {
        const p = pedidoDePrueba();

        expect(urlWhatsapp(p)).toBe(`https://wa.me/593999283765?text=${encodeURIComponent(mensajeComprobante(p))}`);
    });
});
