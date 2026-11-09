// Contrato: GET /api/v1/home/hero (público) y /api/v1/admin/home/hero (panel). `data` es null si no hay portada y la tienda usa su imagen de siempre.
export type PortadaInicio =
  | { type: 'image'; alt: string | null; w: number | null; h: number | null; srcset: Record<string, string> }
  | { type: 'video'; url: string; poster: string | null; duration_s: number | null };
