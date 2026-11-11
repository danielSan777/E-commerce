import { Accesorio, AccesorioColocado } from '../../personalizador/dominio/Accesorios';
import { ConfigUbicacion, Geometria, Ubicacion, geometriaDe } from '../../personalizador/dominio/ubicaciones';
import { GeometriaApi } from '../../personalizador/dominio/configurador';
import { AccesorioAdmin, ConfigGuardableAdmin, ConfigLeidaAdmin } from '../dominio/interfaces/configurador-admin';

/**
 * Conversión entre lo que guarda Laravel (inglés, una fila por ubicación y por excepción) y lo que maneja el editor
 * (cuadros sobre el visor: `accesorioId = 0` es el cuadro con los valores de la ubicación; los demás son excepciones).
 * Son funciones puras: no deciden reglas de negocio, solo cambian la forma. Las reglas las valida Laravel.
 */

export interface EstadoEditor {
  ubicaciones: Ubicacion[];
  configUbicaciones: Record<number, ConfigUbicacion>;
  /** Cuadros de valores de las ubicaciones y excepciones de accesorios. */
  colocados: AccesorioColocado[];
  idsMarcados: number[];
  /** Ubicaciones que ya tienen valores guardados: desde ahí se eligen los accesorios. */
  ubicacionesGuardadas: number[];
  /** Siguiente número libre para los cuadros nuevos del editor. */
  siguienteId: number;
}

export function accesorioDelEditor(a: AccesorioAdmin): Accesorio {
  return {
    id: a.id,
    nombre: a.name,
    imagen: a.image ?? '',
    tipo: a.type,
    texto: a.text ?? undefined,
    categoria: a.category ?? undefined,
    comportamiento: a.behavior,
  };
}

export function geometriaAApi(g: Geometria): GeometriaApi {
  const r = (n: number) => +n.toFixed(3);
  return {
    x: Math.min(100, Math.max(0, r(g.x))),
    y: Math.min(100, Math.max(0, r(g.y))),
    width: r(g.ancho),
    height: r(g.alto),
    rot_x: r(g.rotX),
    rot_y: r(g.rotY),
    rot_z: r(g.rotZ),
    mirror: g.espejo,
  };
}

function geometriaDeApi(g: GeometriaApi): Geometria {
  return { x: g.x, y: g.y, ancho: g.width, alto: g.height, rotX: g.rot_x, rotY: g.rot_y, rotZ: g.rot_z, espejo: g.mirror };
}

export function estadoDesdeApi(config: ConfigLeidaAdmin, accesorios: Accesorio[]): EstadoEditor {
  let id = 1;
  const colocados: AccesorioColocado[] = [];
  const ubicaciones: Ubicacion[] = [];
  const configUbicaciones: Record<number, ConfigUbicacion> = {};
  const ubicacionesGuardadas: number[] = [];

  for (const u of config.locations) {
    ubicaciones.push({
      id: u.location_id,
      nombre: u.name,
      categorias: u.allowed_categories.length ? u.allowed_categories : undefined,
      excluidas: u.excluded_categories.length ? u.excluded_categories : undefined,
    });
    configUbicaciones[u.location_id] = { estado: u.state, prioridad: u.priority, capa: u.layer, fijoId: u.fixed_accessory_id };

    if (u.preset) {
      ubicacionesGuardadas.push(u.location_id);
      colocados.push({
        id: id++, ubicacionId: u.location_id, accesorioId: 0, nombre: u.name, imagen: '', tipo: 'imagen',
        ...geometriaDeApi(u.preset),
      });
    }
  }

  for (const e of config.exceptions) {
    const a = accesorios.find(x => x.id === e.accessory_id);
    if (!a) continue;
    colocados.push({
      id: id++, ubicacionId: e.location_id, accesorioId: a.id, nombre: a.nombre, imagen: a.imagen,
      tipo: a.tipo ?? 'imagen', texto: a.texto, categoria: a.categoria,
      ...geometriaDeApi(e),
    });
  }

  return { ubicaciones, configUbicaciones, colocados, idsMarcados: [...config.accessory_ids], ubicacionesGuardadas, siguienteId: id };
}

/** Mensaje si una ubicación fija no tiene su elemento fijo o sus valores (si todo está bien, null). */
export function errorDeUbicacionesFijas(
  ubicaciones: Ubicacion[], configUbicaciones: Record<number, ConfigUbicacion>, colocados: AccesorioColocado[],
): string | null {
  for (const u of ubicaciones) {
    const c = configUbicaciones[u.id];
    const conValores = colocados.some(a => a.accesorioId === 0 && a.ubicacionId === u.id);
    if (c?.estado === 'fija' && (!c.fijoId || !conValores)) {
      return `La ubicación "${u.nombre}" es fija: elige su elemento fijo y define sus valores.`;
    }
  }
  return null;
}

export function configParaGuardar(
  ubicaciones: Ubicacion[], configUbicaciones: Record<number, ConfigUbicacion>, colocados: AccesorioColocado[], idsMarcados: number[],
): ConfigGuardableAdmin {
  return {
    locations: ubicaciones.map(u => {
      const c = configUbicaciones[u.id];
      const preset = colocados.find(a => a.accesorioId === 0 && a.ubicacionId === u.id);
      return {
        location_id: u.id,
        state: c.estado,
        priority: c.prioridad,
        layer: c.capa,
        fixed_accessory_id: c.estado === 'fija' ? c.fijoId : null,
        preset: preset ? geometriaAApi(geometriaDe(preset)) : null,
      };
    }),
    accessory_ids: [...idsMarcados],
    exceptions: colocados.filter(a => a.accesorioId !== 0).map(a => ({
      accessory_id: a.accesorioId,
      location_id: a.ubicacionId!,
      ...geometriaAApi(geometriaDe(a)),
    })),
  };
}

/** Configuración sin nada: todas las ubicaciones libres y sin valores, y ningún accesorio marcado. */
export function configVacia(ubicaciones: Ubicacion[]): ConfigGuardableAdmin {
  return {
    locations: ubicaciones.map((u, i) => ({ location_id: u.id, state: 'libre', priority: i + 1, layer: 1, fixed_accessory_id: null, preset: null })),
    accessory_ids: [],
    exceptions: [],
  };
}
