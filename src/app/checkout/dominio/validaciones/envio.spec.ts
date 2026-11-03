import { costoEnvio, envioDisponible, zonaEnvio } from './envio';

// Pruebas del Paso 10: zona y tarifa por cantón y provincia (códigos del INEC)
describe('zona y costo de envío', () => {
    it('Guayaquil, Durán y Samborondón son Zona A: $3.50', () => {
        for (const canton of ['Guayaquil', 'Durán', 'Samborondón']) {
            expect(zonaEnvio('Guayas', canton)).toBe('local');
            expect(costoEnvio('Guayas', canton)).toBe(3.5);
        }
    });

    it('reconoce el cantón sin tildes ni mayúsculas', () => {
        expect(zonaEnvio('guayas', 'duran')).toBe('local');
    });

    it('Daule (sin localidad), Quito y Cuenca son Zona C: $5.00', () => {
        expect(costoEnvio('Guayas', 'Daule')).toBe(5);
        expect(costoEnvio('Pichincha', 'Distrito Metropolitano de Quito')).toBe(5);
        expect(costoEnvio('Azuay', 'Cuenca')).toBe(5);
    });

    it('la Amazonía es Zona B: $6.25 (Tena y las otras cinco provincias)', () => {
        expect(zonaEnvio('Napo', 'Tena')).toBe('amazonia');
        expect(costoEnvio('Napo', 'Tena')).toBe(6.25);

        for (const provincia of ['Sucumbíos', 'Orellana', 'Pastaza', 'Morona Santiago', 'Zamora Chinchipe']) {
            expect(zonaEnvio(provincia, '')).toBe('amazonia');
        }
    });

    it('Galápagos (por ejemplo Puerto Ayora, en Santa Cruz) no tiene envío', () => {
        expect(zonaEnvio('Galápagos', 'Santa Cruz')).toBe('no_disponible');
        expect(envioDisponible('Galápagos', 'Santa Cruz')).toBe(false);
        expect(envioDisponible('Guayas', 'Guayaquil')).toBe(true);
    });
});
