// Contrato: GET /api/v1/home/hero (público): `items` es la lista en orden (vacía = la tienda usa su imagen de siempre) y `data` el primero.
// GET /api/v1/admin/home/hero (panel): `data` es la lista, cada una con su `id` para quitarla.
export type PortadaInicio =
  | { id?: string; type: 'image'; alt: string | null; w: number | null; h: number | null; srcset: Record<string, string> }
  | { id?: string; type: 'video'; url: string; poster: string | null; duration_s: number | null };
