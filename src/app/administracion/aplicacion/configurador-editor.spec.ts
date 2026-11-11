import { Accesorio } from '../../personalizador/dominio/Accesorios';
import { ConfigLeidaAdmin } from '../dominio/interfaces/configurador-admin';
import { configParaGuardar, configVacia, errorDeUbicacionesFijas, estadoDesdeApi, geometriaAApi } from './configurador-editor';

const GEO = { x: 10, y: 20, width: 30, height: 15, rot_x: 5, rot_y: -10, rot_z: 90, mirror: true };

const LEIDA: ConfigLeidaAdmin = {
  locations: [
    { location_id: 7, name: 'Cabeza', allowed_categories: ['Moda'], excluded_categories: [], state: 'libre', priority: 1, layer: 2, fixed_accessory_id: null, preset: GEO },
    { location_id: 8, name: 'Pie', allowed_categories: [], excluded_categories: ['Moda'], state: 'fija', priority: 2, layer: 1, fixed_accessory_id: 20, preset: { ...GEO, mirror: false } },
    { location_id: 9, name: 'Base', allowed_categories: [], excluded_categories: [], state: 'deshabilitada', priority: 3, layer: 1, fixed_accessory_id: null, preset: null },
  ],
  accessory_ids: [20, 21],
  exceptions: [{ accessory_id: 20, location_id: 7, ...GEO, x: 33 }],
};

const ACCESORIOS: Accesorio[] = [
  { id: 20, nombre: 'Gafas', imagen: 'https://api/media/g.webp', tipo: 'imagen', categoria: 'Moda' },
  { id: 21, nombre: 'Regalo', imagen: 'https://api/media/r.webp', tipo: 'imagen', categoria: 'Objetos' },
];

describe('configurador-editor', () => {
  it('convierte lo que guarda Laravel en cuadros del visor, ubicaciones y marcados', () => {
    const e = estadoDesdeApi(LEIDA, ACCESORIOS);

    expect(e.ubicaciones).toEqual([
      { id: 7, nombre: 'Cabeza', categorias: ['Moda'], excluidas: undefined },
      { id: 8, nombre: 'Pie', categorias: undefined, excluidas: ['Moda'] },
      { id: 9, nombre: 'Base', categorias: undefined, excluidas: undefined },
    ]);
    expect(e.configUbicaciones[8]).toEqual({ estado: 'fija', prioridad: 2, capa: 1, fijoId: 20 });
    expect(e.idsMarcados).toEqual([20, 21]);
    // Solo las ubicaciones con valores quedan como "guardadas"
    expect(e.ubicacionesGuardadas).toEqual([7, 8]);

    const presets = e.colocados.filter(c => c.accesorioId === 0);
    expect(presets.map(p => p.ubicacionId)).toEqual([7, 8]);
    expect(presets[0]).toMatchObject({ x: 10, y: 20, ancho: 30, alto: 15, rotX: 5, rotY: -10, rotZ: 90, espejo: true });

    const excepcion = e.colocados.find(c => c.accesorioId === 20)!;
    expect(excepcion).toMatchObject({ ubicacionId: 7, nombre: 'Gafas', x: 33, categoria: 'Moda' });
    // Cada cuadro tiene su propio número y el siguiente queda libre
    expect(new Set(e.colocados.map(c => c.id)).size).toBe(3);
    expect(e.siguienteId).toBe(4);
  });

  it('ignora una excepción de un accesorio que ya no existe', () => {
    const e = estadoDesdeApi(LEIDA, [ACCESORIOS[1]]);
    expect(e.colocados.filter(c => c.accesorioId !== 0)).toEqual([]);
  });

  it('guardar y volver a leer deja la configuración igual', () => {
    const e = estadoDesdeApi(LEIDA, ACCESORIOS);
    const payload = configParaGuardar(e.ubicaciones, e.configUbicaciones, e.colocados, e.idsMarcados);

    expect(payload.locations.map(l => ({ id: l.location_id, estado: l.state, preset: l.preset }))).toEqual([
      { id: 7, estado: 'libre', preset: GEO },
      { id: 8, estado: 'fija', preset: { ...GEO, mirror: false } },
      { id: 9, estado: 'deshabilitada', preset: null },
    ]);
    expect(payload.locations[1].fixed_accessory_id).toBe(20);
    expect(payload.accessory_ids).toEqual([20, 21]);
    expect(payload.exceptions).toEqual([{ accessory_id: 20, location_id: 7, ...GEO, x: 33 }]);
  });

  it('solo una ubicación fija lleva elemento fijo al guardar', () => {
    const e = estadoDesdeApi(LEIDA, ACCESORIOS);
    e.configUbicaciones[8] = { ...e.configUbicaciones[8], estado: 'libre' };

    const payload = configParaGuardar(e.ubicaciones, e.configUbicaciones, e.colocados, e.idsMarcados);
    expect(payload.locations[1].fixed_accessory_id).toBeNull();
  });

  it('redondea a 3 decimales y no deja la posición fuera del visor', () => {
    expect(geometriaAApi({ x: 12.345678, y: -0.0004, ancho: 20.12349, alto: 10, rotX: 0, rotY: 0, rotZ: 0, espejo: false }))
      .toEqual({ x: 12.346, y: 0, width: 20.123, height: 10, rot_x: 0, rot_y: 0, rot_z: 0, mirror: false });
    expect(geometriaAApi({ x: 100.0004, y: 100, ancho: 5, alto: 5, rotX: 0, rotY: 0, rotZ: 0, espejo: false }).x).toBe(100);
  });

  it('avisa si una ubicación fija no tiene elemento fijo o valores', () => {
    const e = estadoDesdeApi(LEIDA, ACCESORIOS);
    expect(errorDeUbicacionesFijas(e.ubicaciones, e.configUbicaciones, e.colocados)).toBeNull();

    e.configUbicaciones[8] = { ...e.configUbicaciones[8], fijoId: null };
    expect(errorDeUbicacionesFijas(e.ubicaciones, e.configUbicaciones, e.colocados)).toBe('La ubicación "Pie" es fija: elige su elemento fijo y define sus valores.');

    e.configUbicaciones[8] = { ...e.configUbicaciones[8], fijoId: 20 };
    const sinValores = e.colocados.filter(c => !(c.accesorioId === 0 && c.ubicacionId === 8));
    expect(errorDeUbicacionesFijas(e.ubicaciones, e.configUbicaciones, sinValores)).toContain('"Pie" es fija');
  });

  it('la configuración vacía deja todas las ubicaciones libres, en orden y sin valores', () => {
    const e = estadoDesdeApi(LEIDA, ACCESORIOS);
    expect(configVacia(e.ubicaciones)).toEqual({
      locations: [
        { location_id: 7, state: 'libre', priority: 1, layer: 1, fixed_accessory_id: null, preset: null },
        { location_id: 8, state: 'libre', priority: 2, layer: 1, fixed_accessory_id: null, preset: null },
        { location_id: 9, state: 'libre', priority: 3, layer: 1, fixed_accessory_id: null, preset: null },
      ],
      accessory_ids: [],
      exceptions: [],
    });
  });
});
