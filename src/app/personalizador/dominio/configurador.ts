import { Accesorio, ComportamientoAccesorio } from './Accesorios';
import { ExcepcionGuardada, Geometria, UbicacionGuardada } from './ubicaciones';

/** Geometría tal como la entrega Laravel (inglés): % del visor y giros en grados. */
export interface GeometriaApi {
    x: number;
    y: number;
    width: number;
    height: number;
    rot_x: number;
    rot_y: number;
    rot_z: number;
    mirror: boolean;
}

export interface UbicacionApi {
    location_id: number;
    name: string;
    allowed_categories: string[];
    excluded_categories: string[];
    state: 'libre' | 'fija' | 'deshabilitada';
    priority: number;
    layer: number;
    fixed_accessory_id: number | null;
    preset: GeometriaApi | null;
}

export interface AccesorioApi {
    id: number;
    name: string;
    type: 'imagen' | 'texto';
    behavior: ComportamientoAccesorio | null;
    text: string | null;
    category: string | null;
    image: string | null;
    thumb: string | null;
    alt: string | null;
}

export interface ExcepcionApi extends GeometriaApi {
    accessory_id: number;
    location_id: number;
}

/** `GET /api/v1/products/{slug}/configurator`: la configuración propia del producto o la de su categoría. */
export interface ConfiguradorApi {
    source: 'product' | 'category';
    configured: boolean;
    locations: UbicacionApi[];
    accessories: AccesorioApi[];
    exceptions: ExcepcionApi[];
}

/** Lo que usa el personalizador (los mismos nombres que tenía el archivo estático del editor). */
export interface ConfiguracionGuardada {
    configurado?: boolean;
    ubicaciones?: UbicacionGuardada[];
    excepciones?: ExcepcionGuardada[];
    catalogo?: Accesorio[];
}

export function geometriaDeApi(g: GeometriaApi): Geometria {
    return { x: g.x, y: g.y, ancho: g.width, alto: g.height, rotX: g.rot_x, rotY: g.rot_y, rotZ: g.rot_z, espejo: g.mirror };
}

/** Traduce el contrato de Laravel a los modelos del personalizador. No decide nada: solo cambia los nombres. */
export function adaptarConfigurador(api: ConfiguradorApi): ConfiguracionGuardada {
    return {
        configurado: api.configured,
        ubicaciones: api.locations.map(u => ({
            id: u.location_id,
            nombre: u.name,
            categorias: u.allowed_categories.length ? u.allowed_categories : undefined,
            excluidas: u.excluded_categories.length ? u.excluded_categories : undefined,
            estado: u.state,
            prioridad: u.priority,
            capa: u.layer,
            fijoId: u.fixed_accessory_id,
            preset: u.preset ? geometriaDeApi(u.preset) : null,
        })),
        excepciones: api.exceptions.map(e => ({ accesorioId: e.accessory_id, ubicacionId: e.location_id, ...geometriaDeApi(e) })),
        catalogo: api.accessories.map(a => ({
            id: a.id,
            nombre: a.name,
            imagen: a.image ?? '',
            tipo: a.type,
            texto: a.text ?? undefined,
            categoria: a.category ?? undefined,
            comportamiento: a.behavior,
        })),
    };
}
