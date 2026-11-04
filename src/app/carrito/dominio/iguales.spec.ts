import { ItemCarrito } from '../aplicacion/servicios/CarritoService';
import { macetaIgualSinConfirmar } from './iguales';

const maceta = (uid: string, nombre = 'Ana', extra: Partial<ItemCarrito> = {}): ItemCarrito => ({
  uid, tipo: 'personalizado', producto: { id: 'doctor', nombre: 'Doctor', precio: 20 }, vista: '', ruta: '', resumen: [],
  configuracion: {
    accesorios: [], nombre, colorLentes: 'negro', colorGafas: 'negro', dedicatoria: 'Gracias',
    textoMarco: '', sinTarjeta: false, fotoMarcoNombre: '',
  },
  ...extra,
});

describe('macetaIgualSinConfirmar', () => {
  it('no marca nada con una sola maceta', () => {
    expect(macetaIgualSinConfirmar([maceta('a')])).toBeUndefined();
  });

  it('marca la segunda cuando es idéntica a la primera', () => {
    expect(macetaIgualSinConfirmar([maceta('a'), maceta('b')])?.uid).toBe('b');
  });

  it('no marca macetas con distinto nombre', () => {
    expect(macetaIgualSinConfirmar([maceta('a'), maceta('b', 'Luis')])).toBeUndefined();
  });

  it('no vuelve a preguntar una vez confirmada', () => {
    expect(macetaIgualSinConfirmar([maceta('a'), maceta('b', 'Ana', { igualConfirmada: true })])).toBeUndefined();
  });

  it('ignora los complementos', () => {
    const comp = (uid: string): ItemCarrito => ({ uid, tipo: 'complemento', producto: { id: 'acc-1', nombre: 'Lentes', precio: 2 }, vista: '', ruta: '', resumen: [] });
    expect(macetaIgualSinConfirmar([comp('a'), comp('b')])).toBeUndefined();
  });
});
