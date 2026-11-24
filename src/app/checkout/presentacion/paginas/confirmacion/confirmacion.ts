import { Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PedidoService } from '../../../aplicacion/servicios/PedidoService';
import { PedidoConsultaService, esSeguimiento } from '../../../aplicacion/servicios/PedidoConsultaService';
import { distintivoBanco } from '../../../dominio/interfaces/datos_transferencia';
import { itemsConFoto, nombreArchivoFoto } from '../../../dominio/validaciones/foto_pedido';
import { fechaLarga } from '../../../dominio/validaciones/mensaje_whatsapp';

@Component({
  selector: 'app-confirmacion',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './confirmacion.html',
  styleUrl: './confirmacion.css',
})
export class Confirmacion {

  // ===== EDITABLES =====
  readonly RUTA_SEGUIR = '/categorias';   // "Seguir comprando"

  private pedidos = inject(PedidoService);
  private router = inject(Router);
  private consulta = inject(PedidoConsultaService);
  private destruir = inject(DestroyRef);

  pedido = this.pedidos.pedido;

  // Hasta leer el pedido guardado no se sabe si existe (así no se muestra "sin pedido" por un instante)
  cargado = signal(false);

  esTransferencia = computed(() => this.pedido()?.metodo === 'transferencia');
  fecha = computed(() => (this.pedido() ? fechaLarga(this.pedido()!.fecha) : ''));
  // Todo lo de la transferencia (plazo, cuentas, mensaje y enlace de WhatsApp) lo entregó Laravel al crear el pedido
  pendiente = computed(() => this.pedido()?.pendiente ?? null);
  limite = computed(() => this.pendiente()?.deadline_label ?? '');
  mensaje = computed(() => this.pendiente()?.whatsapp_message ?? '');
  enlaceWhatsapp = computed(() => this.pendiente()?.whatsapp_url ?? '');
  titular = computed(() => this.pendiente()?.bank_accounts[0] ?? null);
  cuentas = computed(() => (this.pendiente()?.bank_accounts ?? []).map(c => ({ ...c, ...distintivoBanco(c.bank) })));

  // Fotos de las macetas personalizadas: se descargan para adjuntarlas en el chat de WhatsApp (el enlace solo lleva texto)
  fotos = computed(() => {
    const p = this.pedido();
    return p ? itemsConFoto(p.items).map((item, i) => ({ item, nombre: nombreArchivoFoto(p.numero, item, i + 1) })) : [];
  });

  fotoDe(uid: string) { return this.fotos().find(f => f.item.uid === uid) ?? null; }

  // Qué se acaba de copiar (para mostrar ✓ un momento)
  copiado = signal('');

  constructor() {
    afterNextRender(() => {
      this.pedidos.restaurar();
      this.cargado.set(true);
      // Un pedido con tarjeta que todavía no se pagó no es una compra confirmada: vuelve a la Cajita
      const p = this.pedido();
      if (p && p.metodo === 'payphone' && !p.pagoConfirmado) this.router.navigateByUrl('/checkout/tarjeta', { replaceUrl: true });
      // Al volver a la pestaña con una transferencia pendiente, se revisa si ya se validó el pago: de ser así, pasa al seguimiento
      const alVolver = () => { if (document.visibilityState === 'visible') this.revisarPago(); };
      document.addEventListener('visibilitychange', alVolver);
      this.destruir.onDestroy(() => document.removeEventListener('visibilitychange', alVolver));
    });
  }

  /** Pregunta a Laravel (en silencio) si la transferencia ya fue validada; si sí, abre el seguimiento del pedido. */
  revisarPago(): void {
    const p = this.pedido();
    if (!p || p.metodo !== 'transferencia' || p.pagoConfirmado) return;
    this.consulta.obtener(p.token).subscribe({
      next: v => { if (esSeguimiento(v)) this.router.navigateByUrl(`/pedido/${p.token}`, { replaceUrl: true }); },
      error: () => { /* se queda la pantalla como estaba */ },
    });
  }

  // El botón de copiar del mensaje copia el mismo mensaje que se manda por WhatsApp
  async copiar(clave: string, texto: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // Navegadores sin permiso para el portapapeles: se usa el método antiguo
      const area = document.createElement('textarea');
      area.value = texto;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy'); } catch { /* sin permiso */ }
      area.remove();
    }

    this.copiado.set(clave);
    setTimeout(() => { if (this.copiado() === clave) this.copiado.set(''); }, 1800);
  }

  copiarMensaje(): void {
    const texto = this.mensaje();
    if (texto) this.copiar('mensaje', texto);
  }

  // Si la foto del producto no existe, se oculta y queda el fondo
  sinImagen(evento: Event): void {
    (evento.target as HTMLImageElement).style.visibility = 'hidden';
  }
}