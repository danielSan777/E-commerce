// Contrato: /api/v1/admin/{products|categories|campaigns}/{clave}/media y /api/v1/admin/media/{id}
export interface ImagenAdmin {
  id: number;
  type: 'image' | 'video';
  role: string;
  alt: string | null;
  sort_order: number;
  width: number | null;
  height: number | null;
  duration_s?: number | null;   // solo en videos
  urls: Record<string, string>; // imagen: ancho → URL (600, 1080); video: { url, poster? }
}

export type DuenoDeImagenes = 'products' | 'categories' | 'campaigns';
