import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { fechaCorta, fechaLarga } from '../../../aplicacion/fechas';
import { copiarAlPortapapeles } from '../../../aplicacion/portapapeles';
import { HojasAdminService } from '../../../aplicacion/servicios/HojasAdminService';
import { PedidosAdminService } from '../../../aplicacion/servicios/PedidosAdminService';
import { HojaDeProduccion, ItemDeHoja, PedidoDeHoja } from '../../../dominio/interfaces/hojas-admin';

const COLORES: Record<string, string> = { negro: 'Negro', cafe: 'Café', dorado: 'Dorado' };
const CANALES: Record<string, string> = { web: 'Web', whatsapp: 'WhatsApp' };
const METODOS: Record<string, string> = { card: 'Tarjeta', transfer: 'Transferencia' };
const ESTADOS_DE_PAGO: Record<string, string> = { paid: 'Pagado', pending_validation: 'Por validar', unpaid: 'Sin pagar', refunded: 'Reembolsado' };

// Hoja de producción de un ciclo: lo que Josué imprime para producir. Sin precios. Se pueden quitar pedidos con la casilla
// y solo los marcados salen impresos. Laravel arma la hoja; Angular solo la muestra.
@Component({
  selector: 'app-admin-hoja-produccion',
  imports: [RouterLink],
  templateUrl: './hoja-produccion.html',
  styleUrl: './hoja-produccion.css',
})
export class AdminHojaProduccion implements OnInit {
  private ruta = inject(ActivatedRoute);
  private servicio = inject(HojasAdminService);
  private pedidos = inject(PedidosAdminService);
  private avisos = inject(AvisosService);
  private destroyRef = inject(DestroyRef);

  readonly fechaLarga = fechaLarga;
  readonly fechaCorta = fechaCorta;
  readonly fecha = this.ruta.snapshot.paramMap.get('fecha') ?? '';

  hoja = signal<HojaDeProduccion | null>(null);
  cargando = signal(true);
  error = signal('');
  incluidos = signal<ReadonlySet<string>>(new Set());
  descargando = signal<number | null>(null);

  seleccionados = computed(() => (this.hoja()?.orders ?? []).filter(p => this.incluidos().has(p.number)));
  totalMacetas = computed(() => this.seleccionados().reduce((n, p) => n + p.planters, 0));

  constructor() {
    inject(Title).setTitle('Hoja de producción | Panel de Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.servicio.produccion(this.fecha).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false))).subscribe({
      next: h => { this.hoja.set(h); this.incluidos.set(new Set(h.orders.map(p => p.number))); },
      error: (e: ErrorApi) => this.error.set(e.message),
    });
  }

  estaIncluido(p: PedidoDeHoja): boolean {
    return this.incluidos().has(p.number);
  }

  alternar(p: PedidoDeHoja): void {
    this.incluidos.update(s => { const n = new Set(s); if (n.has(p.number)) n.delete(p.number); else n.add(p.number); return n; });
  }

  todos(marcar: boolean): void {
    this.incluidos.set(new Set(marcar ? (this.hoja()?.orders ?? []).map(p => p.number) : []));
  }

  imprimir(): void {
    window.print();
  }

  canal = (c: string) => CANALES[c] ?? c;
  metodo = (m: string) => METODOS[m] ?? m;
  estadoDePago = (e: string) => ESTADOS_DE_PAGO[e] ?? e;
  color = (c: string | null) => (c ? (COLORES[c] ?? c) : '');
  esMaceta = (i: ItemDeHoja) => i.type === 'personalizable';

  /** Copia el texto de la placa tal cual, para pegarlo en el software de impresión sin errores de tildes ni ñ. */
  async copiarPlaca(i: ItemDeHoja): Promise<void> {
    if (await copiarAlPortapapeles(i.plate_text ?? '')) this.avisos.exito('Texto de la placa copiado.');
    else this.avisos.error('No se pudo copiar. Selecciona el texto y cópialo a mano.');
  }

  /** Descarga la foto del marco que subió el comprador. */
  descargarFoto(p: PedidoDeHoja, i: ItemDeHoja): void {
    this.descargando.set(i.id);
    this.pedidos.imagenDelItem(p.number, i.id, 'frame-photo').pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.descargando.set(null))).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `${p.number}-marco-${i.id}.${blob.type === 'image/png' ? 'png' : 'jpg'}`;
        enlace.click();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      },
      error: (e: ErrorApi) => this.avisos.error(e.message),
    });
  }
}
