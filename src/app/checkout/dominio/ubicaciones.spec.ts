import { buscarCanton, buscarProvincia, nombresDeCantones, nombresDeProvincias } from './ubicaciones';
import { CATALOGO_PRUEBA } from './ubicaciones.prueba';

describe('ubicaciones', () => {
    it('busca provincias y cantones sin importar tildes ni mayúsculas', () => {
        expect(buscarProvincia(CATALOGO_PRUEBA, 'guayas')?.codigo).toBe('09');
        expect(buscarProvincia(CATALOGO_PRUEBA, 'GALAPAGOS')?.codigo).toBe('20');
        expect(buscarCanton(CATALOGO_PRUEBA, 'Guayas', 'duran')?.codigo).toBe('0907');
    });

    it('los sectores salen en la lista de cantones de su provincia', () => {
        expect(nombresDeCantones(CATALOGO_PRUEBA, 'Guayas')).toContain('La Aurora - Daule');
    });

    it('una provincia o cantón que no existe da vacío', () => {
        expect(nombresDeCantones(CATALOGO_PRUEBA, 'Narnia')).toEqual([]);
        expect(buscarCanton(CATALOGO_PRUEBA, 'Guayas', 'Nada')).toBeUndefined();
        expect(nombresDeProvincias(CATALOGO_PRUEBA)).toEqual(['Guayas', 'Pichincha', 'Napo', 'Galápagos']);
    });
});
