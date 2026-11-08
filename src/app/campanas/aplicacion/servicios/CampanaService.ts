import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { IMAGEN_PENDIENTE } from '../../../categorias/aplicacion/servicios/CategoriaService';
import { CampanaContrato } from '../../dominio/interfaces/campana';

const SITIO = 'https://jardindesele.com';

// Campaña de temporada desde Laravel (GET /api/v1/campaigns/{slug}). Laravel decide si está en temporada o no, el año,
// la fecha del evento y qué productos se muestran; Angular solo lo dibuja.
@Injectable({ providedIn: 'root' })
export class CampanaService {
    private http = inject(HttpClient);
    private api = inject(API_URL);

    /** null si la campaña no existe o está inactiva (404). Cualquier otro error se propaga. */
    campana(slug: string): Observable<CampanaContrato | null> {
        return this.http.get<CampanaContrato>(`${this.api}/campaigns/${encodeURIComponent(slug)}`).pipe(
            map(c => ({
                ...c,
                tagline: c.tagline ?? '',
                slogan: c.slogan ?? '',
                products: c.products.map(p => ({ ...p, image: p.image ?? IMAGEN_PENDIENTE })),
                seo: {
                    title: c.seo.title ?? `${c.name} | Jardín de Sele`,
                    description: c.seo.description ?? c.tagline ?? '',
                    canonical: c.seo.canonical,
                    og_image: c.seo.og_image ?? `${SITIO}/imagenes/amor.png`,
                },
            })),
            catchError((e: HttpErrorResponse) => e.status === 404 ? of(null) : throwError(() => e)),
        );
    }
}
