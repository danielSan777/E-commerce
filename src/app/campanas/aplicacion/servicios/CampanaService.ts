import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, tap, throwError } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { IMAGEN_PENDIENTE } from '../../../categorias/aplicacion/servicios/CategoriaService';
import { CampanaContrato, CampanaResumen, TemaCampana } from '../../dominio/interfaces/campana';

const SITIO = 'https://jardindesele.com';
const TEMA_VACIO: TemaCampana = { color: null, emoji: null, cover: null };

// Campaña de temporada desde Laravel (GET /api/v1/campaigns/{slug}). Laravel decide si está en temporada o no, el año,
// la fecha del evento y qué productos se muestran; Angular solo lo dibuja.
@Injectable({ providedIn: 'root' })
export class CampanaService {
    private http = inject(HttpClient);
    private api = inject(API_URL);
    /** Respuestas ya pedidas: la guarda de rutas y la página piden la misma campaña, y así no se repite la petición. */
    private pedidas = new Map<string, Observable<CampanaContrato | null>>();

    /** null si la campaña no existe o está inactiva (404). Cualquier otro error se propaga. */
    campana(slug: string): Observable<CampanaContrato | null> {
        let pedida = this.pedidas.get(slug);
        if (!pedida) {
            pedida = this.pedir(slug).pipe(
                tap({ error: () => this.pedidas.delete(slug) }),   // un fallo no se recuerda: se vuelve a intentar
                shareReplay(1),
            );
            this.pedidas.set(slug, pedida);
        }
        return pedida;
    }

    /** La campaña que está en temporada hoy, o null si no hay ninguna (Laravel responde siempre 200). */
    vigente(): Observable<CampanaResumen | null> {
        return this.http.get<{ data: CampanaResumen | null }>(`${this.api}/campaigns/current`).pipe(
            map(r => r.data ? { ...r.data, theme: r.data.theme ?? TEMA_VACIO } : null),
        );
    }

    private pedir(slug: string): Observable<CampanaContrato | null> {
        return this.http.get<CampanaContrato>(`${this.api}/campaigns/${encodeURIComponent(slug)}`).pipe(
            map(c => ({
                ...c,
                tagline: c.tagline ?? '',
                slogan: c.slogan ?? '',
                theme: c.theme ?? TEMA_VACIO,
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
