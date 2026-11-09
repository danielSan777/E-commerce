// Contrato: /api/v1/admin/{products|categories|campaigns}/{clave}/media y /api/v1/admin/media/{id}
export interface ImagenAdmin {
  id: number;
  type: 'image';
  role: string;
  alt: string | null;
  sort_order: number;
  width: number | null;
  height: number | null;
  urls: Record<string, string>; // ancho → URL (600, 1080)
}

export type DuenoDeImagenes = 'products' | 'categories' | 'campaigns';
