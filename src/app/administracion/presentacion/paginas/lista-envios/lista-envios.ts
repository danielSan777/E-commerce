import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { aCsv, descargarTexto } from '../../../aplicacion/csv';
import { fechaCorta, fechaLarga } from '../../../aplicacion/fechas';
import { copiarAlPortapapeles } from '../../../aplicacion/portapapeles';
import { HojasAdminService } from '../../../aplicacion/servicios/HojasAdminService';
import { ListaDeEnvios, PedidoParaEnvio, ResultadoDeLote } from '../../../dominio/interfaces/hojas-admin';

/** Guía de Servientrega: letras, números y guiones, de 5 a 40 caracteres (Laravel vuelve a validar). */
export function guiaValida(guia: string): boolean {
  return /^[A-Za-z0-9-]{5,40}$/.test(guia.trim());
}

const DOCUMENTO: Record<string, string> = { cedula: 'Cédula', ruc: 'RUC' };

// Lista de envíos de un ciclo: los datos para crear las guías de Servientrega, el campo de la guía, copiar por fila,
// exportar a CSV, imprimir y marcar el lote como enviado (cada comprador recibe su correo con su guía).
@Component({
  selector: 'app-admin-lista-envios',
  imports: [FormsModule, RouterLink],
  templateUrl: './lista-envios.html',
  styleUrl: './lista-envios.css',
})
export class AdminListaEnvios implements OnInit {
  private ruta = inject(ActivatedRoute);
  private servicio = inject(HojasAdminService);
  private avisos = inject(AvisosService);
  private destroyRef = inject(DestroyRef);

  readonly fechaLarga = fechaLarga;
  readonly fechaCorta = fechaCorta;
  readonly fecha = this.ruta.snapshot.paramMap.get('fecha') ?? '';

  lista = signal<ListaDeEnvios | null>(null);
  cargando = signal(true);
  error = signal('');
  elegidos = signal<ReadonlySet<string>>(new Set());
  guias = signal<Record<string, string>>({});
  confirmando = signal(false);
  enviando = signal(false);
  resultado = signal<ResultadoDeLote | null>(null);

  /** Pedidos marcados que tienen una guía válida y que cambian algo (sin guía, o con una guía distinta a la ya guardada). */
  listosParaEnviar = computed(() => (this.lista()?.orders ?? []).filter(p => this.elegidos().has(p.number)
    && guiaValida(this.guias()[p.number] ?? '') && (this.guias()[p.number] ?? '').trim() !== (p.tracking_number ?? '')));
  sinGuia = computed(() => (this.lista()?.orders ?? []).filter(p => this.elegidos().has(p.number) && p.status !== 'shipped' && !(this.guias()[p.number] ?? '').trim()));
  guiaMala = computed(() => (this.lista()?.orders ?? []).filter(p => { const g = (this.guias()[p.number] ?? '').trim(); return g !== '' && !guiaValida(g); }));

  constructor() {
    inject(Title).setTitle('Lista de envíos | Panel de Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.servicio.envios(this.fecha).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false))).subscribe({
      next: l => this.poner(l),
      error: (e: ErrorApi) => this.error.set(e.message),
    });
  }

  private poner(l: ListaDeEnvios): void {
    this.lista.set(l);
    this.guias.set(Object.fromEntries(l.orders.map(p => [p.number, p.tracking_number ?? ''])));
    // Por defecto se marcan los que todavía no salieron
    this.elegidos.set(new Set(l.orders.filter(p => p.status !== 'shipped').map(p => p.number)));
    this.confirmando.set(false);
  }

  estaElegido(p: PedidoParaEnvio): boolean {
    return this.elegidos().has(p.number);
  }

  alternar(p: PedidoParaEnvio): void {
    this.elegidos.update(s => { const n = new Set(s); if (n.has(p.number)) n.delete(p.number); else n.add(p.number); return n; });
  }

  todos(marcar: boolean): void {
    this.elegidos.set(new Set(marcar ? (this.lista()?.orders ?? []).map(p => p.number) : []));
  }

  escribirGuia(numero: string, valor: string): void {
    this.guias.update(g => ({ ...g, [numero]: valor }));
    this.confirmando.set(false);
  }

  documento = (p: PedidoParaEnvio) => `${DOCUMENTO[p.id_type] ?? p.id_type} ${p.id_number}`;

  /** Texto de una fila para pegar donde se crea la guía. */
  textoDeFila(p: PedidoParaEnvio): string {
    return [p.name, this.documento(p), `Cel. ${p.phone}`, `${p.province}, ${p.canton}`, p.address, p.reference ? `Ref.: ${p.reference}` : ''].filter(Boolean).join('\n');
  }

  async copiarFila(p: PedidoParaEnvio): Promise<void> {
    if (await copiarAlPortapapeles(this.textoDeFila(p))) this.avisos.exito(`Datos de ${p.number} copiados.`);
    else this.avisos.error('No se pudo copiar. Selecciona el texto y cópialo a mano.');
  }

  imprimir(): void {
    window.print();
  }

  /** CSV de los pedidos marcados, con la guía que esté escrita en ese momento. */
  exportarCsv(): void {
    const filas = (this.lista()?.orders ?? []).filter(p => this.elegidos().has(p.number));
    const datos = [['Pedido', 'Destinatario', 'Tipo de documento', 'Documento', 'Celular', 'Provincia', 'Cantón', 'Dirección', 'Referencia', 'Entrega desde', 'Entrega hasta', 'Guía']]
      .concat(filas.map(p => [p.number, p.name, DOCUMENTO[p.id_type] ?? p.id_type, p.id_number, p.phone, p.province, p.canton, p.address, p.reference, p.window.start, p.window.end, (this.guias()[p.number] ?? '').trim()]));
    descargarTexto(`envios-${this.fecha}.csv`, aCsv(datos));
  }

  pedirConfirmacion(): void {
    if (this.guiaMala().length) return this.avisos.error('Revisa las guías marcadas en rojo: solo letras, números y guiones, de 5 a 40 caracteres.');
    if (!this.listosParaEnviar().length) return this.avisos.error('Marca los pedidos y escribe su guía para poder enviarlos.');
    this.confirmando.set(true);
  }

  cancelar(): void {
    this.confirmando.set(false);
  }

  marcarEnviados(): void {
    if (this.enviando()) return;
    const pedidos = this.listosParaEnviar().map(p => ({ number: p.number, tracking_number: (this.guias()[p.number] ?? '').trim() }));
    if (!pedidos.length) return;
    this.enviando.set(true);
    this.servicio.enviarLote(pedidos).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.enviando.set(false))).subscribe({
      next: r => {
        this.resultado.set(r);
        this.confirmando.set(false);
        const fallaron = r.results.length - r.shipped;
        if (fallaron === 0) this.avisos.exito(r.shipped === 1 ? 'Pedido marcado como enviado.' : `${r.shipped} pedidos marcados como enviados.`);
        else this.avisos.error(`${r.shipped} enviados y ${fallaron} con problema. Mira el detalle abajo.`);
        this.cargar();
      },
      error: (e: ErrorApi) => { this.confirmando.set(false); this.avisos.error(e.message); },
    });
  }
}
