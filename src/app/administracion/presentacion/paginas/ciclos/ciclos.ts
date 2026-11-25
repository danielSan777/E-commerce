import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { fechaCorta, fechaLarga, instanteEnGuayaquil } from '../../../aplicacion/fechas';
import { CiclosAdminService } from '../../../aplicacion/servicios/CiclosAdminService';
import { CicloAdmin, EventoDeCiclo, ListaCiclos } from '../../../dominio/interfaces/ciclos-admin';

/** Capacidad escrita a mano: entero de 1 al máximo que dice Laravel. null si no vale. */
export function capacidadValida(texto: string, maximo: number): number | null {
  const limpio = texto.trim();
  if (!/^\d{1,3}$/.test(limpio)) return null;
  const n = Number(limpio);
  return n >= 1 && n <= maximo ? n : null;
}

// Ciclos en el panel: cuántos pedidos tiene cada ciclo y cuánta capacidad queda, capacidad de un ciclo puntual y
// "Pasar las ventas al siguiente ciclo" / "Reabrir ciclo". Laravel cuenta y decide; Angular solo muestra y envía.
@Component({
  selector: 'app-admin-ciclos',
  imports: [FormsModule, RouterLink],
  templateUrl: './ciclos.html',
  styleUrl: './ciclos.css',
})
export class AdminCiclos implements OnInit {
  private servicio = inject(CiclosAdminService);
  private avisos = inject(AvisosService);
  private destroyRef = inject(DestroyRef);

  readonly fechaLarga = fechaLarga;
  readonly fechaCorta = fechaCorta;
  readonly instante = instanteEnGuayaquil;

  lista = signal<ListaCiclos | null>(null);
  cargando = signal(true);
  error = signal('');
  ocupado = signal<string | null>(null);           // fecha del ciclo con una acción en curso
  confirmando = signal<string | null>(null);       // fecha del ciclo cuyo cierre espera confirmación
  capacidades = signal<Record<string, string>>({}); // lo que se está escribiendo en cada ciclo
  errorCapacidad = signal<Record<string, string>>({});

  constructor() {
    inject(Title).setTitle('Ciclos | Panel de Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.servicio.listar().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false))).subscribe({
      next: l => this.poner(l),
      error: (e: ErrorApi) => this.error.set(e.message),
    });
  }

  private poner(l: ListaCiclos): void {
    this.lista.set(l);
    this.capacidades.set(Object.fromEntries(l.data.map(c => [c.date, String(c.capacity_override ?? c.capacity)])));
    this.errorCapacidad.set({});
    this.confirmando.set(null);
  }

  escribir(fecha: string, valor: string): void {
    this.capacidades.update(c => ({ ...c, [fecha]: valor }));
  }

  /** Estado en palabras: lo decide Laravel (`closed`, `remaining`); aquí solo se escribe. */
  estado(c: CicloAdmin): string {
    if (c.closed) return 'Cerrado';
    return c.remaining === 0 ? 'Lleno' : 'Abierto';
  }

  textoEvento(e: EventoDeCiclo): string {
    const quien = e.actor_name ? ` por ${e.actor_name}` : '';
    const cuando = ` · ${this.instante(e.at)}`;
    if (e.type === 'closed') return `Cerrado${quien}${cuando}`;
    if (e.type === 'reopened') return `Reabierto${quien}${cuando}`;
    const a = e.data?.to;
    return (a == null ? 'Capacidad devuelta a la nominal' : `Capacidad cambiada a ${a}`) + quien + cuando;
  }

  pedirCierre(c: CicloAdmin): void {
    this.confirmando.set(c.date);
  }

  cancelarCierre(): void {
    this.confirmando.set(null);
  }

  cerrar(c: CicloAdmin): void {
    this.accion(c.date, this.servicio.cerrar(c.date), `Listo: ${fechaCorta(c.date)} ya no recibe pedidos nuevos. Los que tiene no cambian.`);
  }

  reabrir(c: CicloAdmin): void {
    this.accion(c.date, this.servicio.reabrir(c.date), `Ciclo del ${fechaCorta(c.date)} reabierto.`);
  }

  guardarCapacidad(c: CicloAdmin, evento: Event): void {
    evento.preventDefault();
    const maximo = this.lista()?.meta.max_capacity ?? 30;
    const n = capacidadValida(this.capacidades()[c.date] ?? '', maximo);
    if (n === null) {
      this.errorCapacidad.update(e => ({ ...e, [c.date]: `Escribe un número entero de 1 a ${maximo}.` }));
      return this.avisos.faltanDatos();
    }
    this.accion(c.date, this.servicio.cambiarCapacidad(c.date, n), `Capacidad del ${fechaCorta(c.date)}: ${n} pedidos.`);
  }

  usarNominal(c: CicloAdmin): void {
    this.accion(c.date, this.servicio.cambiarCapacidad(c.date, null), `El ${fechaCorta(c.date)} vuelve a la capacidad normal.`);
  }

  private accion(fecha: string, peticion: Observable<ListaCiclos>, exito: string): void {
    if (this.ocupado()) return;
    this.ocupado.set(fecha);
    peticion.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.ocupado.set(null))).subscribe({
      next: l => { this.poner(l); this.avisos.exito(exito); },
      error: (e: ErrorApi) => { this.confirmando.set(null); this.avisos.error(e.message); },
    });
  }
}
