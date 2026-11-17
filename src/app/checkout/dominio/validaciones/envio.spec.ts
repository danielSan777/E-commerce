import { CATALOGO_PRUEBA } from '../ubicaciones.prueba';
import { CATALOGO_VACIO } from '../ubicaciones';
import { costoEnvio, envioDesde, envioDisponible, tieneDiaAdicional, zonaEnvio } from './envio';

const C = CATALOGO_PRUEBA;

describe('envío por zona (datos de la base de datos)', () => {
    it('la zona sale del cantón elegido', () => {
        expect(zonaEnvio(C, 'Guayas', 'Guayaquil')).toBe('A');
        expect(zonaEnvio(C, 'guayas', 'duran')).toBe('A');
        expect(zonaEnvio(C, 'Guayas', 'Milagro')).toBe('C');
        expect(zonaEnvio(C, 'Guayas', 'La Aurora - Daule')).toBe('A');
    });

    it('el costo en dólares sale de los centavos de la zona', () => {
        expect(costoEnvio(C, 'Guayas', 'Guayaquil')).toBe(3.5);
        expect(costoEnvio(C, 'Pichincha', 'Distrito Metropolitano de Quito')).toBe(5);
        expect(costoEnvio(C, 'Napo', 'Tena')).toBe(6.25);
    });

    it('si el administrador cambia la tarifa, el costo cambia', () => {
        const cambiado = { ...C, zonas: C.zonas.map(z => (z.codigo === 'C' ? { ...z, centavos: 550 } : z)) };
        expect(costoEnvio(cambiado, 'Guayas', 'Milagro')).toBe(5.5);
    });

    it('los días adicionales de la zona los define el administrador', () => {
        expect(tieneDiaAdicional(C, 'Napo', 'Tena')).toBe(true);
        expect(tieneDiaAdicional(C, 'Guayas', 'Guayaquil')).toBe(false);
    });

    it('un cantón desconocido se cobra como Zona B', () => {
        expect(zonaEnvio(C, 'Napo', '')).toBe('B');
        expect(zonaEnvio(C, 'Guayas', 'No existe')).toBe('B');
        expect(costoEnvio(C, 'Guayas', 'No existe')).toBe(6.25);
    });

    it('la zona no disponible no cobra ni permite el pedido', () => {
        expect(envioDisponible(C, 'Galápagos', 'San Cristóbal')).toBe(false);
        expect(costoEnvio(C, 'Galápagos', 'San Cristóbal')).toBe(0);
        expect(envioDisponible(C, 'Guayas', 'Guayaquil')).toBe(true);
    });

    it('«Envío desde» es la tarifa más baja disponible, o nada si aún no hay datos', () => {
        expect(envioDesde(C)).toBe(3.5);
        expect(envioDesde(CATALOGO_VACIO)).toBeNull();
    });
});
