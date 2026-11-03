import { Pedido } from '../../aplicacion/servicios/PedidoService';
import { ItemCarrito } from '../../../carrito/aplicacion/servicios/CarritoService';
import { mensajeCompleto, mensajeCorto, urlWhatsapp } from './mensaje_whatsapp';

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
        items: [item],
        datos: {
            nombre: 'María Pérez', tipoDoc: 'cedula', cedula: '0954091989', celular: '0991234567',
            correo: 'maria@correo.com', provincia: 'Guayas', canton: 'Durán', direccion: 'Av. Principal 123', referencia: '',
            facturacion: 'mismos',
            fNombre: '', fTipoDoc: 'cedula', fCedula: '', fCelular: '', fCorreo: '', fProvincia: '', fCanton: '', fDireccion: '',
            contacto: 'mismo', contactoNumero: '',
            metodoPago: 'transferencia',
        },
        subtotal: 25, envio: 3.5, envioGratis: false, recargo: 0, total: 28.5,
    };
}

describe('mensaje de WhatsApp del pedido', () => {
    it('no promete enviar nada después por WhatsApp (todo se completa antes de pagar)', () => {
        const texto = mensajeCompleto(pedidoDePrueba());

        expect(texto).not.toContain('Te enviaré por aquí');
        expect(texto.toLowerCase()).not.toContain('pendiente');
    });

    it('incluye el número de pedido, los productos con su personalización y el total', () => {
        const texto = mensajeCompleto(pedidoDePrueba());

        expect(texto).toContain('JDS-48213');
        expect(texto).toContain('Maceta Doctor');
        expect(texto).toContain('Tarjeta de dedicatoria: «Gracias por todo»');
        expect(texto).toContain('$28.50');
    });

    it('el mensaje corto menciona el pedido y la urlWhatsapp lo lleva codificado', () => {
        const p = pedidoDePrueba();

        expect(mensajeCorto(p)).toContain('JDS-48213');
        expect(urlWhatsapp(p)).toContain('https://wa.me/593999283765?text=');
    });
});
