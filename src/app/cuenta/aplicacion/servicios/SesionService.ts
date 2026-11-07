import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, Injector, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../../core/configuracion/api';
import { DatosRegistro, ErrorApi, RespuestaSesion, Sesion } from '../../dominio/interfaces/sesion';

const CLAVE = 'jds_sesion';

/** Convierte cualquier fallo HTTP en un ErrorApi con mensaje en español para mostrar. */
export function aErrorApi(e: unknown): ErrorApi {
  if (e instanceof HttpErrorResponse && e.error && typeof e.error === 'object' && 'code' in e.error) {
    return { status: e.status, code: e.error.code, message: e.error.message, errors: e.error.errors, products: e.error.products, products_count: e.error.products_count };
  }
  if (e instanceof HttpErrorResponse && e.status === 429) {
    return { status: 429, code: 'too_many_requests', message: 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.' };
  }
  return { status: 0, code: 'network_error', message: 'No pudimos conectarnos con el servidor. Inténtalo de nuevo.' };
}

// Sesión de clientes y administradores. Laravel valida todo y dice el rol; aquí solo se guarda el token Bearer y se lo envía.
// El rol guardado sirve para decidir qué pantalla mostrar; la seguridad real la aplica Laravel en cada llamada.
// El token vive en localStorage (solo navegador). Los textos de error vienen de la API.
@Injectable({ providedIn: 'root' })
export class SesionService {
  private injector = inject(Injector);
  private api = inject(API_URL);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  private sesion = signal<Sesion | null>(this.leer());

  readonly usuario = computed(() => this.sesion()?.user ?? null);
  readonly esAdministrador = computed(() => this.sesion()?.user.role === 'admin');

  // HttpClient se pide al usarlo: la barra de navegación lee la sesión sin necesitar HTTP.
  private get http(): HttpClient {
    return this.injector.get(HttpClient);
  }

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
    await this.abrir('login', { email, password, device: this.dispositivo() });
  }

  async crearCuenta(datos: DatosRegistro): Promise<void> {
    await this.abrir('register', { ...datos, device: this.dispositivo() });
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

  private async abrir(ruta: 'login' | 'register', cuerpo: object): Promise<void> {
    try {
      const r = await firstValueFrom(this.http.post<RespuestaSesion>(`${this.api}/auth/${ruta}`, cuerpo));
      // El vencimiento se calcula con el reloj de este navegador (no depende de que coincida con el del servidor).
      const vence = typeof r.expires_in === 'number' ? new Date(Date.now() + r.expires_in * 1000).toISOString() : r.expires_at;
      this.guardar({ token: r.token, expires_at: vence, user: r.user });
    } catch (e) {
      throw aErrorApi(e);
    }
  }

  private async avisar(ruta: 'logout' | 'logout-all'): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.api}/auth/${ruta}`, {}));
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

  private guardar(s: Sesion): void {
    this.sesion.set(s);
    if (!this.esNavegador) return;
    try { localStorage.setItem(CLAVE, JSON.stringify(s)); } catch { /* almacenamiento bloqueado: la sesión vive en memoria */ }
  }

  private borrar(): void {
    if (!this.esNavegador) return;
    try { localStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ }
  }

  private leer(): Sesion | null {
    if (!this.esNavegador) return null;
    try {
      const s = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as Sesion | null;
      return s && typeof s.token === 'string' && typeof s.expires_at === 'string' && s.user && typeof s.user.role === 'string' ? s : null;
    } catch {
      return null;
    }
  }
}
