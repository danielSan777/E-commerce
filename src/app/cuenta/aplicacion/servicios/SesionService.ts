import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, Injector, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MonoTypeOperatorFunction, Observable, catchError, finalize, map, of, tap, throwError } from 'rxjs';
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
  if (e instanceof HttpErrorResponse && e.status >= 500) {
    return { status: e.status, code: 'server_error', message: 'El servidor tuvo un problema al procesar la solicitud. Revisa el último error en storage/logs/laravel.log del backend.' };
  }
  return { status: 0, code: 'network_error', message: 'No pudimos conectarnos con el servidor. Inténtalo de nuevo.' };
}

/** Operador RxJS: convierte el error HTTP del flujo en un ErrorApi (mensaje en español). */
export function conErrorApi<T>(): MonoTypeOperatorFunction<T> {
  return catchError(e => throwError(() => aErrorApi(e)));
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
  private temporizador: ReturnType<typeof setTimeout> | undefined;
  private vencioAdministrador = false;

  constructor() {
    if (!this.esNavegador) return;
    this.programarVencimiento();
    // Si el equipo estuvo suspendido o la pestaña dormida, el temporizador puede llegar tarde: al volver se revisa.
    document.addEventListener('visibilitychange', () => {
      const s = this.sesion();
      if (document.visibilityState === 'visible' && s?.expires_at && Date.parse(s.expires_at) <= Date.now()) this.vencer();
    });
  }

  readonly usuario = computed(() => this.sesion()?.user ?? null);
  readonly esAdministrador = computed(() => this.sesion()?.user.role === 'admin');

  // HttpClient se pide al usarlo: la barra de navegación lee la sesión sin necesitar HTTP.
  private get http(): HttpClient {
    return this.injector.get(HttpClient);
  }

  token(): string | null {
    return this.estaAutenticado() ? this.sesion()!.token : null;
  }

  /** true si la sesión de administrador que había en este equipo terminó por tiempo (para avisarlo en el ingreso). */
  venciaEnEsteEquipo(): boolean {
    return this.vencioAdministrador;
  }

  estaAutenticado(): boolean {
    const s = this.sesion();
    if (!s) return false;
    if (s.expires_at !== null && Date.parse(s.expires_at) <= Date.now()) {
      this.vencioAdministrador = s.user.role === 'admin';
      this.olvidar();
      return false;
    }
    return true;
  }

  iniciarSesion(email: string, password: string): Observable<void> {
    return this.abrir('login', { email, password, device: this.dispositivo() });
  }

  crearCuenta(datos: DatosRegistro): Observable<void> {
    return this.abrir('register', { ...datos, device: this.dispositivo() });
  }

  /** Cierra esta sesión. Aunque la API falle, el navegador queda sin token. */
  cerrarSesion(): Observable<void> {
    return this.avisar('logout');
  }

  /** "Cerrar todas las sesiones": invalida el token de todos los dispositivos. */
  cerrarTodas(): Observable<void> {
    return this.avisar('logout-all');
  }

  /** La API rechazó el token (401): se descarta sin llamar a la API. */
  olvidar(): void {
    clearTimeout(this.temporizador);
    this.sesion.set(null);
    this.borrar();
  }

  private abrir(ruta: 'login' | 'register', cuerpo: object): Observable<void> {
    return this.http.post<RespuestaSesion>(`${this.api}/auth/${ruta}`, cuerpo).pipe(
      // El vencimiento se calcula con el reloj de este navegador (no depende de que coincida con el del servidor).
      tap(r => this.guardar({ token: r.token, expires_at: this.vencimiento(r), user: r.user })),
      tap(() => this.programarVencimiento()),
      map(() => undefined),
      conErrorApi(),
    );
  }

  /**
   * Vencimiento calculado con el reloj de este navegador. Si el servidor no manda `expires_in` y su fecha ya pasó
   * (reloj desfasado o configuración vieja), se asume 1 hora: Laravel sigue siendo quien rechaza un token vencido (401).
   */
  private vencimiento(r: RespuestaSesion): string | null {
    if (r.expires_at === null) return null; // cliente: la sesión no vence
    if (typeof r.expires_in === 'number' && r.expires_in > 0) return new Date(Date.now() + r.expires_in * 1000).toISOString();
    const delServidor = Date.parse(r.expires_at);
    return delServidor > Date.now() ? r.expires_at : new Date(Date.now() + 2 * 3600_000).toISOString();
  }

  /** Mientras la sesión tenga vencimiento (administrador) se programa su fin, aunque la persona no haga nada en la pantalla. */
  private programarVencimiento(): void {
    clearTimeout(this.temporizador);
    const vence = this.sesion()?.expires_at;
    if (!vence) return;
    const falta = Math.max(0, Date.parse(vence) - Date.now());
    this.temporizador = setTimeout(() => this.vencer(), Math.min(falta, 2 ** 31 - 1));
  }

  /** Terminó el tiempo: el administrador vuelve al ingreso con un aviso; el cliente no pasa por aquí (su sesión no vence). */
  private vencer(): void {
    const eraAdministrador = this.esAdministrador();
    this.vencioAdministrador = eraAdministrador;
    this.olvidar();
    if (!eraAdministrador) return;
    const router = this.injector.get(Router);
    if (router.url.startsWith('/ingresar')) return;
    void router.navigate(['/ingresar'], { queryParams: { motivo: 'vencida', returnUrl: router.url } });
  }

  private avisar(ruta: 'logout' | 'logout-all'): Observable<void> {
    return this.http.post(`${this.api}/auth/${ruta}`, {}).pipe(
      map(() => undefined),
      // Si el token ya no servía (401) la sesión ya está cerrada en el servidor.
      catchError(e => {
        if (e instanceof HttpErrorResponse && e.status === 401) return of(undefined);
        this.olvidar();
        return throwError(() => aErrorApi(e));
      }),
      finalize(() => this.olvidar()),
    );
  }

  private dispositivo(): string | null {
    return this.esNavegador ? navigator.userAgent.slice(0, 120) : null;
  }

  private guardar(s: Sesion): void {
    this.vencioAdministrador = false;
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
      return s && typeof s.token === 'string' && (s.expires_at === null || typeof s.expires_at === 'string') && s.user && typeof s.user.role === 'string' ? s : null;
    } catch {
      return null;
    }
  }
}
