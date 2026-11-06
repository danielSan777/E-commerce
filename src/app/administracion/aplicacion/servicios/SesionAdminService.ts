import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { ErrorApi, RespuestaLogin, SesionAdmin } from '../../dominio/interfaces/sesion';

const CLAVE = 'jds_admin_sesion';

/** Convierte cualquier fallo HTTP en un ErrorApi con mensaje en español para mostrar. */
export function aErrorApi(e: unknown): ErrorApi {
  if (e instanceof HttpErrorResponse && e.error && typeof e.error === 'object' && 'code' in e.error) {
    return { status: e.status, code: e.error.code, message: e.error.message, errors: e.error.errors };
  }
  if (e instanceof HttpErrorResponse && e.status === 429) {
    return { status: 429, code: 'too_many_requests', message: 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.' };
  }
  return { status: 0, code: 'network_error', message: 'No pudimos conectarnos con el servidor. Inténtalo de nuevo.' };
}

// Sesión del panel del administrador. Laravel valida todo; aquí solo se guarda el token Bearer y se lo envía.
// El token vive en localStorage (solo navegador). Los textos de error vienen de la API.
@Injectable({ providedIn: 'root' })
export class SesionAdminService {
  private http = inject(HttpClient);
  private api = inject(API_URL);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  private sesion = signal<SesionAdmin | null>(this.leer());

  readonly usuario = computed(() => this.sesion()?.user ?? null);

  token(): string | null {
    return this.estaAutenticado() ? this.sesion()!.token : null;
  }

  estaAutenticado(): boolean {
    const s = this.sesion();
    if (!s) return false;
    if (Date.parse(s.expires_at) <= Date.now()) {
      this.olvidar();
      return false;
    }
    return true;
  }

  async iniciarSesion(email: string, password: string): Promise<void> {
    try {
      const r = await firstValueFrom(
        this.http.post<RespuestaLogin>(`${this.api}/admin/login`, { email, password, device: this.dispositivo() }),
      );
      this.guardar({ token: r.token, expires_at: r.expires_at, user: r.user });
    } catch (e) {
      throw aErrorApi(e);
    }
  }

  /** Cierra esta sesión. Aunque la API falle, el navegador queda sin token. */
  async cerrarSesion(): Promise<void> {
    await this.avisar('logout');
  }

  /** "Cerrar todas las sesiones": invalida el token de todos los dispositivos. */
  async cerrarTodas(): Promise<void> {
    await this.avisar('logout-all');
  }

  /** La API rechazó el token (401): se descarta sin llamar a la API. */
  olvidar(): void {
    this.sesion.set(null);
    this.borrar();
  }

  private async avisar(ruta: 'logout' | 'logout-all'): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.api}/admin/${ruta}`, {}));
    } catch (e) {
      // Si el token ya no servía (401) la sesión ya está cerrada en el servidor.
      if (!(e instanceof HttpErrorResponse && e.status === 401)) {
        this.olvidar();
        throw aErrorApi(e);
      }
    } finally {
      this.olvidar();
    }
  }

  private dispositivo(): string | null {
    return this.esNavegador ? navigator.userAgent.slice(0, 120) : null;
  }

  private guardar(s: SesionAdmin): void {
    this.sesion.set(s);
    if (!this.esNavegador) return;
    try { localStorage.setItem(CLAVE, JSON.stringify(s)); } catch { /* almacenamiento bloqueado: la sesión vive en memoria */ }
  }

  private borrar(): void {
    if (!this.esNavegador) return;
    try { localStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ }
  }

  private leer(): SesionAdmin | null {
    if (!this.esNavegador) return null;
    try {
      const s = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as SesionAdmin | null;
      return s && typeof s.token === 'string' && typeof s.expires_at === 'string' && s.user ? s : null;
    } catch {
      return null;
    }
  }
}
