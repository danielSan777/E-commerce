import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { aErrorApi } from '../../../cuenta/aplicacion/servicios/SesionService';
import { CampanaAdmin, DatosCampana } from '../../dominio/interfaces/campana-admin';

// Campañas del panel: todo viene de Laravel. Los errores llegan ya normalizados (ErrorApi) con el mensaje en español.
@Injectable({ providedIn: 'root' })
export class CampanasAdminService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  listar(): Promise<CampanaAdmin[]> {
    return this.pedir(async () => (await firstValueFrom(this.http.get<{ data: CampanaAdmin[] }>(this.url()))).data);
  }

  crear(datos: DatosCampana): Promise<CampanaAdmin> {
    return this.pedir(() => firstValueFrom(this.http.post<CampanaAdmin>(this.url(), datos)));
  }

  /** La dirección (slug) no se envía: no se puede cambiar. */
  editar(slug: string, datos: DatosCampana): Promise<CampanaAdmin> {
    return this.pedir(() => firstValueFrom(this.http.put<CampanaAdmin>(this.url(slug), datos)));
  }

  eliminar(slug: string): Promise<void> {
    return this.pedir(async () => { await firstValueFrom(this.http.delete(this.url(slug))); });
  }

  private url(slug?: string): string {
    return `${this.api}/admin/campaigns${slug ? '/' + encodeURIComponent(slug) : ''}`;
  }

  private async pedir<T>(accion: () => Promise<T>): Promise<T> {
    try {
      return await accion();
    } catch (e) {
      throw aErrorApi(e);
    }
  }
}
