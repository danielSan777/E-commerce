import { Component, computed, input, output, signal } from '@angular/core';
import { VentanaDisponible } from '../../../checkout/dominio/interfaces/promesa';
import { textoDias } from '../../../checkout/dominio/validaciones/fechas';

interface Dia {
  fecha: string;            // YYYY-MM-DD
  numero: number;
  ventana?: VentanaDisponible;
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Calendario de ventanas de entrega. Solo dibuja lo que llega en `ventanas` (Laravel las calcula): tocar un día
// elige su ventana completa (2 días, por ejemplo sábado + lunes). Los días sin ventana o no disponibles salen deshabilitados.
@Component({
  selector: 'app-calendario-ventanas',
  templateUrl: './calendario-ventanas.html',
  styleUrl: './calendario-ventanas.css',
})
export class CalendarioVentanas {
  readonly ventanas = input.required<VentanaDisponible[]>();
  readonly elegida = input<VentanaDisponible | undefined>(undefined);
  readonly elegir = output<VentanaDisponible>();

  readonly SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  textoDias = textoDias;

  private mesActual = signal(0);

  // Meses que tienen ventanas (YYYY-MM)
  meses = computed(() => [...new Set(this.ventanas().flatMap(v => [v.start.slice(0, 7), v.end.slice(0, 7)]))].sort());

  private indiceMes = computed(() => {
    const e = this.elegida();
    const inicial = e ? this.meses().indexOf(e.start.slice(0, 7)) : -1;
    return Math.min(Math.max(this.mesActual() || Math.max(inicial, 0), 0), this.meses().length - 1);
  });

  mes = computed(() => this.meses()[this.indiceMes()] ?? '');
  tituloMes = computed(() => {
    const [a, m] = this.mes().split('-').map(Number);
    return a ? `${MESES[m - 1]} ${a}` : '';
  });
  hayAnterior = computed(() => this.indiceMes() > 0);
  haySiguiente = computed(() => this.indiceMes() < this.meses().length - 1);

  // Ventana que se resalta al pasar el mouse o enfocar un día
  resaltada = signal<VentanaDisponible | undefined>(undefined);

  // Celdas del mes en semanas que empiezan en lunes (solo para dibujar la cuadrícula)
  celdas = computed<(Dia | null)[]>(() => {
    const [a, m] = this.mes().split('-').map(Number);
    if (!a) return [];
    const primero = (new Date(Date.UTC(a, m - 1, 1)).getUTCDay() + 6) % 7;
    const total = new Date(Date.UTC(a, m, 0)).getUTCDate();
    const celdas: (Dia | null)[] = Array(primero).fill(null);
    for (let d = 1; d <= total; d++) {
      const fecha = `${this.mes()}-${String(d).padStart(2, '0')}`;
      celdas.push({ fecha, numero: d, ventana: this.ventanas().find(v => v.start === fecha || v.end === fecha) });
    }
    return celdas;
  });

  esDeVentana(dia: Dia, v: VentanaDisponible | undefined): boolean {
    return !!v && !!dia.ventana && dia.ventana.start === v.start && dia.ventana.end === v.end;
  }

  mover(paso: number): void {
    this.mesActual.set(this.indiceMes() + paso);
  }

  elegirDia(dia: Dia): void {
    if (dia.ventana?.available) this.elegir.emit(dia.ventana);
  }
}
