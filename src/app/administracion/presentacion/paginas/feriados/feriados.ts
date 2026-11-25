import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { fechaLarga } from '../../../aplicacion/fechas';
import { DiasNoHabilesAdminService } from '../../../aplicacion/servicios/DiasNoHabilesAdminService';
import { DiaNoHabil, ListaDiasNoHabiles, TipoDiaNoHabil } from '../../../dominio/interfaces/dias-no-habiles';

export const TIPOS: { valor: TipoDiaNoHabil; nombre: string }[] = [
  { valor: 'national_holiday', nombre: 'Feriado nacional' },
  { valor: 'local_holiday', nombre: 'Feriado local de Guayaquil' },
  { valor: 'closure', nombre: 'Cierre propio' },
];

interface FormularioDia { desde: string; hasta: string; tipo: TipoDiaNoHabil; produccion: boolean; despacho: boolean; entrega: boolean; nota: string }

/** Revisa el formulario antes de llamar a la API (Laravel vuelve a validar). */
export function validarDia(f: FormularioDia, hoy = ''): Record<string, string> {
  const e: Record<string, string> = {};
  const fecha = /^\d{4}-\d{2}-\d{2}$/;
  if (!fecha.test(f.desde)) e['desde'] = 'Elige la fecha.';
  else if (hoy && f.desde < hoy) e['desde'] = 'No puedes bloquear un día que ya pasó.';
  if (f.hasta && !fecha.test(f.hasta)) e['hasta'] = 'La fecha final no es válida.';
  else if (f.hasta && fecha.test(f.desde) && f.hasta < f.desde) e['hasta'] = 'La fecha final no puede ser anterior a la inicial.';
  if (!f.produccion && !f.despacho && !f.entrega) e['afecta'] = 'Marca al menos una cosa a la que afecta.';
  if (f.nota.length > 150) e['nota'] = 'La nota no puede pasar de 150 caracteres.';
  return e;
}

const FORMULARIO_VACIO: FormularioDia = { desde: '', hasta: '', tipo: 'national_holiday', produccion: true, despacho: true, entrega: true, nota: '' };
export { fechaLarga };

// Feriados y cierres en el panel: un día o un rango. Laravel los guarda y los usa para el despacho y el calendario de entrega.
@Component({
  selector: 'app-admin-feriados',
  imports: [FormsModule, RouterLink],
  templateUrl: './feriados.html',
  styleUrl: './feriados.css',
})
export class AdminFeriados implements OnInit {
  private servicio = inject(DiasNoHabilesAdminService);
  private avisos = inject(AvisosService);
  private destroyRef = inject(DestroyRef);

  readonly tipos = TIPOS;
  readonly fechaLarga = fechaLarga;

  dias = signal<DiaNoHabil[]>([]);
  meta = signal<ListaDiasNoHabiles['meta'] | null>(null);
  cargando = signal(true);
  error = signal('');
  guardando = signal(false);
  eliminando = signal<string | null>(null);
  intento = signal(false);
  formulario = signal<FormularioDia>({ ...FORMULARIO_VACIO });
  /** Hoy en Guayaquil, que lo dice Laravel: el formulario no deja elegir días anteriores. */
  hoy = computed(() => this.meta()?.today ?? '');
  /** El rango no puede empezar antes de la fecha inicial elegida. */
  minimoHasta = computed(() => this.formulario().desde || this.hoy());
  errores = computed(() => this.intento() ? validarDia(this.formulario(), this.hoy()) : {});

  /** Aviso si el año que viene no tiene ningún feriado nacional cargado. */
  sinFeriadosDelAnioSiguiente = computed(() => this.meta()?.national_holidays_next_year === 0);

  /** Los días agrupados por año, del más cercano al más lejano. */
  porAnio = computed(() => {
    const grupos = new Map<string, DiaNoHabil[]>();
    for (const d of this.dias()) {
      const anio = d.date.slice(0, 4);
      grupos.set(anio, [...(grupos.get(anio) ?? []), d]);
    }
    return [...grupos].map(([anio, dias]) => ({ anio, dias }));
  });

  constructor() {
    inject(Title).setTitle('Feriados y cierres | Panel de Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.servicio.listar().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false))).subscribe({
      next: r => { this.dias.set(r.data); this.meta.set(r.meta); },
      error: (e: ErrorApi) => this.error.set(e.message),
    });
  }

  poner<K extends keyof FormularioDia>(campo: K, valor: FormularioDia[K]): void {
    this.formulario.update(f => ({ ...f, [campo]: valor }));
  }

  nombreTipo(tipo: TipoDiaNoHabil): string {
    return TIPOS.find(t => t.valor === tipo)?.nombre ?? tipo;
  }

  afecta(d: DiaNoHabil): string {
    const cosas = [d.affects_production && 'producción', d.affects_dispatch && 'despacho', d.affects_delivery && 'entrega'].filter(Boolean);
    return cosas.join(', ');
  }

  guardar(evento: Event): void {
    evento.preventDefault();
    const f = this.formulario();
    if (this.guardando()) return;
    this.intento.set(true);
    if (Object.keys(validarDia(f, this.hoy())).length) return this.avisos.faltanDatos();
    this.guardando.set(true);
    this.servicio.guardar({
      date: f.desde, end_date: f.hasta && f.hasta !== f.desde ? f.hasta : null, type: f.tipo,
      affects_production: f.produccion, affects_dispatch: f.despacho, affects_delivery: f.entrega, note: f.nota.trim() || null,
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.guardando.set(false))).subscribe({
      next: guardados => {
        this.avisos.exito(guardados.length === 1 ? 'Día guardado.' : `${guardados.length} días guardados.`);
        this.formulario.set({ ...FORMULARIO_VACIO });
        this.intento.set(false);
        this.cargar();
      },
      error: (e: ErrorApi) => this.avisos.error(e.message),
    });
  }

  quitar(d: DiaNoHabil): void {
    if (this.eliminando()) return;
    this.eliminando.set(d.date);
    this.servicio.eliminar(d.date).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.eliminando.set(null))).subscribe({
      next: () => { this.avisos.exito('Día quitado: vuelve a contar como día hábil.'); this.cargar(); },
      error: (e: ErrorApi) => this.avisos.error(e.message),
    });
  }
}
