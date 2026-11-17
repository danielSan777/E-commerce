import { ItemCarrito } from '../../../carrito/aplicacion/servicios/CarritoService';
import { DatosCheckout } from '../../aplicacion/servicios/CheckoutService';
import { armarSolicitud, VERSION_TERMINOS } from './solicitud_pedido';

const codigos = { provincia: (n: string) => (n === 'Guayas' ? '09' : '17'), canton: (_p: string, c: string) => (c === 'Durán' ? '0907' : '1701') };

const item = (over: Partial<ItemCarrito> = {}): ItemCarrito => ({
    uid: 'u', tipo: 'personalizado', producto: { id: 'doctor', nombre: 'Doctor', precio: 25 }, vista: 'data:image/jpeg;base64,AA', ruta: '', resumen: [],
    configuracion: { accesorios: [], nombre: ' Josué ', colorLentes: 'negro', colorGafas: 'negro', dedicatoria: ' Gracias ', textoMarco: '', sinTarjeta: false, fotoMarcoNombre: '' },
    ...over,
});

const datos = (over: Partial<DatosCheckout> = {}): DatosCheckout => ({
    nombre: 'María Pérez', tipoDoc: 'cedula', cedula: '0954091989', celular: '0991234567', correo: 'm@correo.com',
    provincia: 'Guayas', canton: 'Durán', direccion: 'Av. Principal 123', referencia: '',
    facturacion: 'mismos', fNombre: '', fTipoDoc: 'cedula', fCedula: '', fCelular: '', fCorreo: '', fProvincia: '', fCanton: '', fDireccion: '',
    contacto: 'mismo', contactoNumero: '', metodoPago: 'transferencia', entrega: 'inmediata', ventanaInicio: '', ventanaFin: '', ...over,
});

const entrega = { tipo: 'inmediata' as const, window: { start: '2026-11-12', end: '2026-11-13' }, label: 'x', promise_token: 'firmado' };

describe('armarSolicitud (POST /checkout)', () => {
    it('traduce envío, códigos del INEC, total en centavos y términos', () => {
        const s = armarSolicitud({ items: [item()], datos: datos(), totalCentavos: 2850, entrega, tracking: null }, codigos);

        expect(s.shipping).toMatchObject({ province_code: '09', canton_code: '0907', id_number: '0954091989', phone: '0991234567' });
        expect(s.expected_total_cents).toBe(2850);
        expect(s.expected_window).toEqual(entrega.window);
        expect(s.promise_token).toBe('firmado');
        expect(s.payment_method).toBe('transfer');
        expect(s.window_choice).toEqual({ type: 'immediate' });
        expect(s.terms).toEqual({ accepted: true, version: VERSION_TERMINOS });
        expect(s.billing).toEqual({ same_as_shipping: true });
        expect(s.contact).toEqual({ same_as_shipping: true });
    });

    it('personalización: nombre y dedicatoria sin espacios sobrantes, y la foto de la maceta', () => {
        const [i] = armarSolicitud({ items: [item()], datos: datos(), totalCentavos: 1, entrega, tracking: null }, codigos).items;

        expect(i.slug).toBe('doctor');
        expect(i.personalization).toMatchObject({ name_text: 'Josué', dedication: { mode: 'text', text: 'Gracias' } });
        expect(i.preview_image).toBe('data:image/jpeg;base64,AA');
    });

    it('manda accesorios, colores, frase y la foto del marco ya reducida', () => {
        const conMarco = item({ configuracion: { ...item().configuracion!, accesorios: [{ id: 1, accesorioId: 7, nombre: 'Lentes' }, { id: 2, accesorioId: 9, nombre: 'Marco' }, { id: 3, accesorioId: 7, nombre: 'Lentes' }] as never, colorLentes: 'cafe', colorGafas: 'negro', textoMarco: ' Mi doctora ' } });
        const [i] = armarSolicitud({ items: [conMarco], datos: datos(), totalCentavos: 1, entrega, tracking: null, fotosMarco: { u: 'data:image/jpeg;base64,BB' } }, codigos).items;

        expect(i.personalization).toMatchObject({ accessory_ids: [7, 9], lens_color: 'cafe', glasses_color: 'negro', frame_text: 'Mi doctora', frame_photo: 'data:image/jpeg;base64,BB' });
    });

    it('sin foto en memoria no manda foto del marco', () => {
        const [i] = armarSolicitud({ items: [item()], datos: datos(), totalCentavos: 1, entrega, tracking: null }, codigos).items;

        expect(i.personalization?.frame_photo).toBeNull();
    });

    it('"No quiero dedicatoria" manda modo none; un complemento no lleva personalización ni foto', () => {
        const sin = item({ configuracion: { ...item().configuracion!, sinTarjeta: true } });
        const comp = item({ tipo: 'complemento', producto: { id: 'abono', nombre: 'Abono', precio: 5 }, configuracion: undefined });
        const [a, b] = armarSolicitud({ items: [sin, comp], datos: datos(), totalCentavos: 1, entrega, tracking: null }, codigos).items;

        expect(a.personalization?.dedication).toEqual({ mode: 'none', text: '' });
        expect(b.personalization).toBeNull();
        expect(b.preview_image).toBeNull();
    });

    it('facturación y contacto distintos, y entrega programada', () => {
        const d = datos({ facturacion: 'otros', fNombre: 'Empresa', fTipoDoc: 'ruc', fCedula: '0992541346001', fCelular: '0987654321', fCorreo: 'e@e.com', fProvincia: 'Pichincha', fCanton: 'Quito', fDireccion: 'Calle 1', contacto: 'otro', contactoNumero: '0980000000' });
        const s = armarSolicitud({ items: [item()], datos: d, totalCentavos: 1, entrega: { ...entrega, tipo: 'programada' }, tracking: null }, codigos);

        expect(s.billing).toMatchObject({ same_as_shipping: false, id_type: 'ruc', province_code: '17', canton_code: '1701' });
        expect(s.contact).toEqual({ same_as_shipping: false, phone: '0980000000' });
        expect(s.window_choice).toEqual({ type: 'scheduled', start: '2026-11-12' });
    });
});
