// Modelo de ubicaciones (slots) del producto. Lo usan el editor y el cliente.
// Va en la carpeta "dominio" (src/app/dominio/ubicaciones.ts).

export type EstadoUbicacion = 'libre' | 'fija' | 'deshabilitada';

/**Ubicaciones del producto (fijas en el código). */
export interface Ubicacion {
    id: number;
    nombre: string;
    /** Categorías de accesorios permitidas en la ubicación (sin definir = todas). */
    categorias?: string[];
    /** Categorías que NO se permiten en la ubicación (el resto sí). */
    excluidas?: string[];
}

export const UBICACIONES: Ubicacion[] = [
    { id: 1, nombre: 'Cabeza', categorias: ['Moda'] },
    { id: 2, nombre: 'Pie izquierdo', excluidas: ['Moda', 'Personalización'] },
    { id: 3, nombre: 'Pie derecho', excluidas: ['Moda', 'Personalización'] },
    { id: 4, nombre: 'Entre las piernas', excluidas: ['Moda', 'Personalización'] },
    { id: 5, nombre: 'Base', categorias: ['Personalización'] }
];

/** Posición, tamaño, giro y espejo (todo en % del visor, giros en grados). */
export interface Geometria {
    x: number;
    y: number;
    ancho: number;
    alto: number;
    rotX: number;
    rotY: number;
    rotZ: number;
    espejo: boolean;
}

/** Configuración de una ubicación en el editor. */
export interface ConfigUbicacion {
    estado: EstadoUbicacion;   // libre = el cliente puede usarla; fija = elemento fijo; deshabilitada = no se usa
    prioridad: number;         // 1 = la primera que se propone al cliente
    capa: number;              // orden de capa (z-index): mayor = más al frente
    fijoId: number | null;     // accesorio fijo (solo si estado = 'fija')
}

/** Lo que se guarda por ubicación: su configuración + los valores por defecto (preset). */
export interface UbicacionGuardada extends Ubicacion, ConfigUbicacion {
    preset: Geometria | null;
}

/** Excepción: valores propios de UN accesorio en UNA ubicación. */
export interface ExcepcionGuardada extends Geometria {
    accesorioId: number;
    ubicacionId: number;
}

export function configInicial(): Record<number, ConfigUbicacion> {
    const config: Record<number, ConfigUbicacion> = {};

    UBICACIONES.forEach((u, i) => {
        config[u.id] = { estado: 'libre', prioridad: i + 1, capa: 1, fijoId: null };
    });

    return config;
}

export function geometriaDe(a: {
    x: number; y: number; ancho: number; alto: number;
    rotX?: number; rotY?: number; rotZ?: number; espejo?: boolean;
}): Geometria {
    return {
        x: a.x,
        y: a.y,
        ancho: a.ancho,
        alto: a.alto,
        rotX: a.rotX ?? 0,
        rotY: a.rotY ?? 0,
        rotZ: a.rotZ ?? 0,
        espejo: a.espejo ?? false,
    };
}