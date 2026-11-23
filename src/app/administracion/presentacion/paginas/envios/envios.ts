import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { centavosADolares, dolaresACentavos } from '../../../aplicacion/dinero';
import { EnviosAdminService } from '../../../aplicacion/servicios/EnviosAdminService';
import { AjusteModoVenta, CantonAdmin, CodigoZona, ModoVenta, ZonaAdmin } from '../../../dominio/interfaces/envios-admin';

interface FormularioZona { precio: string; dias: number | string; disponible: boolean }

/** Revisa la tarifa de una zona antes de llamar a la API (mismos límites que Laravel). */
export function validarZona(f: FormularioZona): Record<string, string> {
  const e: Record<string, string> = {};
  const centavos = dolaresACentavos(f.precio);
  if (centavos === null) e['precio'] = 'Escribe el precio en dólares. Ejemplo: 3.50';
  const dias = Number(f.dias);
  if (f.dias === '' || !Number.isInteger(dias) || dias < 0 || dias > 30) e['dias'] = 'Escribe los días adicionales como un número entero, de 0 a 30.';
  return e;
}

const NOMBRES: Record<CodigoZona, string> = { A: 'Zona A', B: 'Zona B', C: 'Zona C', no_disponible: 'No disponible' };

// Envíos en el panel: tarifa de cada zona y a qué zona pertenece cada cantón. Angular solo muestra y envía; Laravel guarda.
@Component({
  selector: 'app-admin-envios',
  imports: [FormsModule, RouterLink],
  templateUrl: './envios.html',
  styleUrl: './envios.css',
})
export class AdminEnvios implements OnInit {
  private servicio = inject(EnviosAdminService);
  private avisos = inject(AvisosService);
  private destroyRef = inject(DestroyRef);

  readonly nombres = NOMBRES;
  readonly codigos: CodigoZona[] = ['A', 'B', 'C', 'no_disponible'];

  // Modo de venta: cuál está activo en la tienda y cuál está elegido en pantalla (se activa al guardar)
  ajusteModo = signal<AjusteModoVenta | null>(null);
  modoElegido = signal<ModoVenta>('standard');
  guardandoModo = signal(false);
  modoSinGuardar = computed(() => !!this.ajusteModo() && this.ajusteModo()!.mode !== this.modoElegido());

  zonas = signal<ZonaAdmin[]>([]);
  formularios = signal<Record<string, FormularioZona>>({});
  cantones = signal<CantonAdmin[]>([]);
  cargando = signal(true);
  error = signal('');
  guardandoZona = signal<CodigoZona | null>(null);
  intentoZona = signal<CodigoZona | null>(null);

  // Filtros de la lista de cantones (en pantalla, sin ir a la API)
  provincia = signal('');
  zonaFiltro = signal('');
  texto = signal('');
  marcados = signal<ReadonlySet<string>>(new Set());
  zonaMasiva: CodigoZona = 'A';
  moviendo = signal(false);

  provincias = computed(() => {
    const vistas = new Map<string, string>();
    for (const c of this.cantones()) vistas.set(c.province_code, c.province_name);
    return [...vistas].map(([codigo, nombre]) => ({ codigo, nombre }));
  });

  visibles = computed(() => {
    const q = normalizar(this.texto().trim());
    return this.cantones().filter(c =>
      (!this.provincia() || c.province_code === this.provincia())
      && (!this.zonaFiltro() || c.zone === this.zonaFiltro())
      && (!q || normalizar(c.name).includes(q)));
  });

  todosMarcados = computed(() => this.visibles().length > 0 && this.visibles().every(c => this.marcados().has(c.code)));

  constructor() {
    inject(Title).setTitle('Envíos | Panel de Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.servicio.modoDeVenta().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: a => { this.ajusteModo.set(a); this.modoElegido.set(a.mode); },
      error: (e: ErrorApi) => this.error.set(e.message),
    });
    this.servicio.zonas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: z => this.ponerZonas(z),
      error: (e: ErrorApi) => this.error.set(e.message),
    });
    this.servicio.cantones().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false))).subscribe({
      next: c => this.cantones.set(c),
      error: (e: ErrorApi) => this.error.set(e.message),
    });
  }

  private ponerZonas(zonas: ZonaAdmin[]): void {
    this.zonas.set(zonas);
    this.formularios.set(Object.fromEntries(zonas.map(z => [z.code, { precio: centavosADolares(z.price_cents), dias: z.extra_days, disponible: z.is_available }])));
  }

  errores(codigo: CodigoZona): Record<string, string> {
    const f = this.formularios()[codigo];
    return this.intentoZona() === codigo && f ? validarZona(f) : {};
  }

  guardarZona(codigo: CodigoZona, evento: Event): void {
    evento.preventDefault();
    const f = this.formularios()[codigo];
    if (!f || this.guardandoZona()) return;
    this.intentoZona.set(codigo);
    if (Object.keys(validarZona(f)).length) return this.avisos.faltanDatos();
    this.guardandoZona.set(codigo);
    this.servicio.actualizarZona(codigo, { price_cents: dolaresACentavos(f.precio)!, extra_days: Number(f.dias), is_available: f.disponible })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.guardandoZona.set(null))).subscribe({
        next: z => {
          this.zonas.update(lista => lista.map(x => (x.code === z.code ? { ...x, ...z } : x)));
          this.avisos.exito(`${NOMBRES[codigo]} guardada.`);
        },
        error: (e: ErrorApi) => this.avisos.error(e.message),
      });
  }

  guardarModo(): void {
    if (this.guardandoModo() || !this.modoSinGuardar()) return;
    this.guardandoModo.set(true);
    this.servicio.guardarModoDeVenta(this.modoElegido()).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.guardandoModo.set(false))).subscribe({
      next: a => {
        this.ajusteModo.set(a);
        this.modoElegido.set(a.mode);
        this.avisos.exito(a.mode === 'standard' ? 'Modo estándar activado.' : 'Modo «todo con envío gratis» activado.');
      },
      error: (e: ErrorApi) => this.avisos.error(e.message),
    });
  }

  // ----- Cantones -----
  marcar(codigo: string, marcado: boolean): void {
    this.marcados.update(s => { const n = new Set(s); if (marcado) n.add(codigo); else n.delete(codigo); return n; });
  }

  marcarVisibles(marcado: boolean): void {
    this.marcados.update(s => { const n = new Set(s); for (const c of this.visibles()) { if (marcado) n.add(c.code); else n.delete(c.code); } return n; });
  }

  /** Cambia la zona de un cantón (o de todos los marcados) y refresca los conteos. */
  mover(zona: CodigoZona, codigos: string[]): void {
    if (!codigos.length || this.moviendo()) return;
    this.moviendo.set(true);
    this.servicio.asignarZona(zona, codigos).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.moviendo.set(false))).subscribe({
      next: n => {
        const set = new Set(codigos);
        this.cantones.update(l => l.map(c => (set.has(c.code) ? { ...c, zone: zona } : c)));
        this.marcados.set(new Set());
        this.servicio.zonas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: z => this.zonas.update(actual => actual.map(a => ({ ...a, cantons_count: z.find(x => x.code === a.code)?.cantons_count ?? a.cantons_count }))) });
        this.avisos.exito(n === 1 ? 'Cantón movido a ' + NOMBRES[zona] + '.' : `${n} cantones movidos a ${NOMBRES[zona]}.`);
      },
      error: (e: ErrorApi) => this.avisos.error(e.message),
    });
  }

  cambiarZona(canton: CantonAdmin, zona: string): void {
    if (zona === canton.zone) return;
    this.mover(zona as CodigoZona, [canton.code]);
  }

  moverMarcados(): void {
    this.mover(this.zonaMasiva, [...this.marcados()]);
  }

  limpiarFiltros(): void {
    this.provincia.set('');
    this.zonaFiltro.set('');
    this.texto.set('');
  }

  ponerFormulario(codigo: CodigoZona, campo: keyof FormularioZona, valor: string | number | boolean): void {
    this.formularios.update(f => ({ ...f, [codigo]: { ...f[codigo], [campo]: valor } as FormularioZona }));
  }
}

/** Sin tildes ni mayúsculas, para buscar "duran" y encontrar "Durán". */
function normalizar(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
