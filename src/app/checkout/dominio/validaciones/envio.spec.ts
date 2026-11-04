import { costoEnvio, envioDisponible, tieneDiaAdicional, zonaEnvio } from './envio';
import { nombresDeCantones } from '../ubicaciones';
import tablaZonas from '../datos/zonas-envio.json';
import inec from '../datos/ubicaciones-inec.json';

describe('zona y costo de envío', () => {
    it('la tabla tiene los 222 cantones del INEC, una vez cada uno', () => {
        const codigos = inec.provincias.flatMap(p => p.cantones.map(c => c.codigo)).sort();
        expect(tablaZonas.cantones.map(c => c.codigo).sort()).toEqual(codigos);
    });

    it('Guayaquil, Daule, Durán, Samborondón y Salitre son Zona A: $3.50', () => {
        for (const canton of ['Guayaquil', 'Daule', 'Durán', 'Samborondón', 'Salitre']) {
            expect(zonaEnvio('Guayas', canton)).toBe('A');
            expect(costoEnvio('Guayas', canton)).toBe(3.5);
        }
    });

    it('reconoce el cantón sin tildes ni mayúsculas', () => {
        expect(zonaEnvio('guayas', 'duran')).toBe('A');
    });

    it('La Aurora, La Joya, Villa Club y Villa Italia (Daule) siguen en la lista y son Zona A', () => {
        for (const sector of ['La Aurora - Daule', 'La Joya - Daule', 'Villa Club - Daule', 'Villa Italia - Daule']) {
            expect(nombresDeCantones('Guayas')).toContain(sector);
            expect(zonaEnvio('Guayas', sector)).toBe('A');
        }
    });

    it('Quito, Cuenca, Machala, Milagro, Salinas y Balao son Zona C: $5.00', () => {
        expect(costoEnvio('Pichincha', 'Distrito Metropolitano de Quito')).toBe(5);
        expect(costoEnvio('Azuay', 'Cuenca')).toBe(5);
        expect(costoEnvio('El Oro', 'Machala')).toBe(5);
        expect(zonaEnvio('Guayas', 'Milagro')).toBe('C');
        expect(zonaEnvio('Santa Elena', 'Salinas')).toBe('C');
        expect(zonaEnvio('Guayas', 'Balao')).toBe('C');
    });

    it('Amazonía y destinos al mismo costo son Zona B: $6.25 y +1 día', () => {
        for (const [prov, cant] of [['Napo', 'Tena'], ['Pastaza', 'Arajuno'], ['El Oro', 'Zaruma'], ['Loja', 'Catamayo'], ['El Oro', 'Santa Rosa']]) {
            expect(zonaEnvio(prov, cant)).toBe('B');
            expect(costoEnvio(prov, cant)).toBe(6.25);
            expect(tieneDiaAdicional(prov, cant)).toBe(true);
        }
        expect(tieneDiaAdicional('Pichincha', 'Distrito Metropolitano de Quito')).toBe(false);
    });

    it('sin cantón o con un cantón desconocido se cobra Zona B, la más cara', () => {
        expect(zonaEnvio('Napo', '')).toBe('B');
        expect(zonaEnvio('Guayas', 'No existe')).toBe('B');
    });

    it('Galápagos, Taisha y Aguarico no tienen envío por la web', () => {
        expect(envioDisponible('Galápagos', 'Santa Cruz')).toBe(false);
        expect(envioDisponible('Morona Santiago', 'Taisha')).toBe(false);
        expect(envioDisponible('Orellana', 'Aguarico')).toBe(false);
        expect(envioDisponible('Guayas', 'Guayaquil')).toBe(true);
    });
});
