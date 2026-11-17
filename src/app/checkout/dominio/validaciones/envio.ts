import { buscarCanton, CatalogoUbicaciones, CodigoZona, ZonaDeEnvio } from '../ubicaciones';

/*
 * Zona y costo de envío según el cantón que el comprador eligió. Las zonas, sus tarifas y la zona de cada cantón
 * las edita el administrador (panel > Envíos) y llegan desde Laravel: aquí solo se leen.
 * Un cantón que no se encuentra se cobra como Zona B (la más cara), igual que en el documento maestro.
 */

export const MENSAJE_SIN_ENVIO = 'Por ahora no enviamos a esta zona desde la web. Escríbenos por WhatsApp y lo coordinamos.';

const ZONA_DE_RESPALDO: CodigoZona = 'B';

function zonaDe(catalogo: CatalogoUbicaciones, codigo: CodigoZona): ZonaDeEnvio | undefined {
    return catalogo.zonas.find(z => z.codigo === codigo);
}

export function zonaEnvio(catalogo: CatalogoUbicaciones, provincia: string, canton: string): CodigoZona {
    return buscarCanton(catalogo, provincia, canton)?.zona ?? ZONA_DE_RESPALDO;
}

export function envioDisponible(catalogo: CatalogoUbicaciones, provincia: string, canton: string): boolean {
    return zonaDe(catalogo, zonaEnvio(catalogo, provincia, canton))?.disponible ?? true;
}

// Las zonas con días adicionales (hoy la B) suman esos días a la ventana de entrega.
export function tieneDiaAdicional(catalogo: CatalogoUbicaciones, provincia: string, canton: string): boolean {
    return (zonaDe(catalogo, zonaEnvio(catalogo, provincia, canton))?.diasAdicionales ?? 0) > 0;
}

/** Dólares (los centavos de la zona entre 100). Sin envío = 0. */
export function costoEnvio(catalogo: CatalogoUbicaciones, provincia: string, canton: string): number {
    const zona = zonaDe(catalogo, zonaEnvio(catalogo, provincia, canton));
    return zona && zona.disponible ? zona.centavos / 100 : 0;
}

// La tarifa más baja entre las zonas disponibles, para "Envío desde $3,50 según destino"; null si aún no hay datos.
export function envioDesde(catalogo: CatalogoUbicaciones): number | null {
    const precios = catalogo.zonas.filter(z => z.disponible).map(z => z.centavos);
    return precios.length ? Math.min(...precios) / 100 : null;
}
