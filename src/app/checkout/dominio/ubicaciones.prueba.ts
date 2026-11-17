// Datos de ejemplo solo para las pruebas.
import { CatalogoUbicaciones } from './ubicaciones';

export const CATALOGO_PRUEBA: CatalogoUbicaciones = {
    zonas: [
        { codigo: 'A', nombre: 'Zona A', centavos: 350, diasAdicionales: 0, disponible: true },
        { codigo: 'B', nombre: 'Zona B', centavos: 625, diasAdicionales: 1, disponible: true },
        { codigo: 'C', nombre: 'Zona C', centavos: 500, diasAdicionales: 0, disponible: true },
        { codigo: 'no_disponible', nombre: 'No disponible', centavos: 0, diasAdicionales: 0, disponible: false },
    ],
    provincias: [
        { codigo: '09', nombre: 'Guayas', cantones: [
            { codigo: '0901', nombre: 'Guayaquil', zona: 'A', sector: false },
            { codigo: '0907', nombre: 'Durán', zona: 'A', sector: false },
            { codigo: '0909', nombre: 'Milagro', zona: 'C', sector: false },
            { codigo: '0906-01', nombre: 'La Aurora - Daule', zona: 'A', sector: true },
        ] },
        { codigo: '17', nombre: 'Pichincha', cantones: [{ codigo: '1701', nombre: 'Distrito Metropolitano de Quito', zona: 'C', sector: false }] },
        { codigo: '15', nombre: 'Napo', cantones: [{ codigo: '1501', nombre: 'Tena', zona: 'B', sector: false }] },
        { codigo: '20', nombre: 'Galápagos', cantones: [{ codigo: '2001', nombre: 'San Cristóbal', zona: 'no_disponible', sector: false }] },
    ],
};
