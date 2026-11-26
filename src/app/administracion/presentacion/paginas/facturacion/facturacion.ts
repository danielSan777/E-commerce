import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { centavosADolares } from '../../../aplicacion/dinero';
import { instanteEnGuayaquil } from '../../../aplicacion/fechas';
import { copiarAlPortapapeles } from '../../../aplicacion/portapapeles';
import { FacturacionAdminService } from '../../../aplicacion/servicios/FacturacionAdminService';
import { PedidoPorFacturar, ResultadoDeFacturado } from '../../../dominio/interfaces/facturacion-admin';

/** Número de factura: letras, números y guiones, hasta 30 (Laravel vuelve a validar). Vacío vale: es opcional. */
export function numeroDeFacturaValido(numero: string): boolean {
  const n = numero.trim();
  return n === '' || /^[A-Za-z0-9-]{1,30}$/.test(n);
}

const DOCUMENTO: Record<string, string> = { cedula: 'Cédula', ruc: 'RUC' };

// Facturación manual: Laravel dice a quién se factura y por cuánto; Josué emite la factura SRI fuera del sistema,
// copia cada dato y aquí la marca como hecha (con su número, si quiere guardarlo).
@Component({
  selector: 'app-admin-facturacion',
  imports: [FormsModule, RouterLink],
  templateUrl: './facturacion.html',
  styleUrl: './facturacion.css',
})
export class AdminFacturacion implements OnInit {
  private servicio = inject(FacturacionAdminService);
  private avisos = inject(AvisosService);
  private destroyRef = inject(DestroyRef);

  readonly instante = instanteEnGuayaquil;
  readonly dolares = centavosADolares;

  estado = signal<'pending' | 'done'>('pending');
  pedidos = signal<PedidoPorFacturar[]>([]);
  pendientes = signal(0);
  cargando = signal(true);
  error = signal('');
  elegidos = signal<ReadonlySet<string>>(new Set());
  numeros = signal<Record<string, string>>({});
  confirmando = signal(false);
  guardando = signal(false);
  resultado = signal<ResultadoDeFacturado | null>(null);

  listosParaMarcar = computed(() => this.pedidos().filter(p => this.elegidos().has(p.number)));
  numeroMalo = computed(() => this.pedidos().filter(p => !numeroDeFacturaValido(this.numeros()[p.number] ?? '')));

  constructor() {
    inject(Title).setTitle('Facturación | Panel de Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  ngOnInit(): void {
    this.cargar();
  }

  cambiarEstado(e: 'pending' | 'done'): void {
    if (this.estado() === e) return;
    this.estado.set(e);
    this.resultado.set(null);
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.servicio.listar(this.estado()).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false))).subscribe({
      next: l => {
        this.pedidos.set(l.data);
        this.pendientes.set(l.meta.pending_count);
        this.numeros.set(Object.fromEntries(l.data.map(p => [p.number, p.invoice_number ?? ''])));
        this.elegidos.set(new Set());
        this.confirmando.set(false);
      },
      error: (e: ErrorApi) => this.error.set(e.message),
    });
  }

  estaElegido = (p: PedidoPorFacturar) => this.elegidos().has(p.number);

  alternar(p: PedidoPorFacturar): void {
    this.elegidos.update(s => { const n = new Set(s); if (n.has(p.number)) n.delete(p.number); else n.add(p.number); return n; });
    this.confirmando.set(false);
  }

  todos(marcar: boolean): void {
    this.elegidos.set(new Set(marcar ? this.pedidos().map(p => p.number) : []));
    this.confirmando.set(false);
  }

  escribirNumero(numero: string, valor: string): void {
    this.numeros.update(n => ({ ...n, [numero]: valor }));
    this.confirmando.set(false);
  }

  documento = (p: PedidoPorFacturar) => `${DOCUMENTO[p.invoice_to.id_type] ?? p.invoice_to.id_type} ${p.invoice_to.id_number}`;

  async copiar(etiqueta: string, valor: string): Promise<void> {
    if (await copiarAlPortapapeles(valor)) this.avisos.exito(`${etiqueta} copiado.`);
    else this.avisos.error('No se pudo copiar. Selecciona el texto y cópialo a mano.');
  }

  pedirConfirmacion(): void {
    if (this.numeroMalo().length) return this.avisos.error('Revisa el número de factura marcado en rojo: solo letras, números y guiones, hasta 30 caracteres.');
    if (!this.listosParaMarcar().length) return this.avisos.error('Marca al menos un pedido.');
    this.confirmando.set(true);
  }

  cancelar(): void {
    this.confirmando.set(false);
  }

  marcarFacturados(): void {
    if (this.guardando()) return;
    const lote = this.listosParaMarcar().map(p => ({ number: p.number, invoice_number: (this.numeros()[p.number] ?? '').trim() || null }));
    if (!lote.length) return;
    this.guardando.set(true);
    this.servicio.marcar(lote).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.guardando.set(false))).subscribe({
      next: r => {
        this.resultado.set(r);
        this.confirmando.set(false);
        const fallaron = r.results.length - r.invoiced;
        if (fallaron === 0) this.avisos.exito(r.invoiced === 1 ? 'Pedido marcado como facturado.' : `${r.invoiced} pedidos marcados como facturados.`);
        else this.avisos.error(`${r.invoiced} facturados y ${fallaron} con problema. Mira el detalle abajo.`);
        this.cargar();
      },
      error: (e: ErrorApi) => { this.confirmando.set(false); this.avisos.error(e.message); },
    });
  }

  quitar(p: PedidoPorFacturar): void {
    if (this.guardando()) return;
    this.guardando.set(true);
    this.servicio.quitar(p.number).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.guardando.set(false))).subscribe({
      next: () => { this.avisos.exito(`${p.number} vuelve a "Por facturar".`); this.cargar(); },
      error: (e: ErrorApi) => this.avisos.error(e.message),
    });
  }
}
