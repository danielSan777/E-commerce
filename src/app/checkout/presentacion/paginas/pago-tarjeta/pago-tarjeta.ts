import { CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';
import { PagoTarjetaService } from '../../../aplicacion/servicios/PagoTarjetaService';
import { PedidoService } from '../../../aplicacion/servicios/PedidoService';
import { CajitaPayphone, IntentoDePago } from '../../../dominio/interfaces/pago_tarjeta';

type Estado = 'cargando' | 'listo' | 'vencida' | 'error';

declare global {
  interface Window { PPaymentButtonBox?: new (opciones: Record<string, unknown>) => { render: (id: string) => void }; }
}

/**
 * Paso 13: pantalla de pago con tarjeta. Laravel entrega el intento y los datos de la Cajita; aquí solo se muestra.
 * PayPhone devuelve al cliente a /checkout/tarjeta/respuesta (URL configurada en la app de PayPhone), donde Laravel confirma.
 * Con PayPhone en modo de pruebas (sin credenciales, solo desarrollo) se muestra un panel para simular el resultado.
 */
@Component({
  selector: 'app-pago-tarjeta',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './pago-tarjeta.html',
  styleUrl: './pago-tarjeta.css',
})
export class PagoTarjeta {
  readonly RUTA_RESPUESTA = '/checkout/tarjeta/respuesta';
  readonly RUTA_PAGO = '/checkout/pago';

  private pedidos = inject(PedidoService);
  private pagos = inject(PagoTarjetaService);
  private router = inject(Router);
  private platform = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);

  pedido = this.pedidos.pedido;
  estado = signal<Estado>('cargando');
  error = signal('');
  intento = signal<IntentoDePago | null>(null);
  segundos = signal(0);
  minutos = computed(() => `${Math.floor(this.segundos() / 60)}:${String(this.segundos() % 60).padStart(2, '0')}`);
  /** Un pedido por tarjeta sin pagar es el único que puede estar aquí */
  hayPedido = signal(false);

  private reloj?: ReturnType<typeof setInterval>;

  constructor() {
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
    this.destroyRef.onDestroy(() => clearInterval(this.reloj));
    afterNextRender(() => {
      this.pedidos.restaurar();
      const p = this.pedido();
      if (!p || p.metodo !== 'payphone' || p.pagoConfirmado) {
        this.router.navigateByUrl(this.RUTA_PAGO, { replaceUrl: true });
        return;
      }
      this.hayPedido.set(true);
      this.iniciar();
    });
  }

  /** Pide a Laravel el intento (el mismo mientras no venza) y monta la Cajita. */
  iniciar(): void {
    const p = this.pedido();
    if (!p) return;
    clearInterval(this.reloj);
    this.estado.set('cargando');
    this.error.set('');
    this.pagos.iniciar(p.token).subscribe({
      next: intento => {
        this.intento.set(intento);
        this.estado.set('listo');
        this.arrancarReloj(intento.expires_at);
        if (!intento.simulated && intento.box) this.montarCajita(intento.box);
      },
      error: (e: ErrorApi) => {
        this.error.set(e.message);
        this.estado.set('error');
      },
    });
  }

  private arrancarReloj(venceEn: string): void {
    const calcular = () => Math.max(0, Math.round((new Date(venceEn).getTime() - Date.now()) / 1000));
    this.segundos.set(calcular());
    if (!isPlatformBrowser(this.platform)) return;
    this.reloj = setInterval(() => {
      this.segundos.set(calcular());
      if (this.segundos() === 0) {
        clearInterval(this.reloj);
        this.estado.set('vencida');   // la Cajita vence a los 10 minutos: se pide una nueva
      }
    }, 1000);
  }

  /** Carga el CSS y el script de la Cajita (solo en el navegador) y la dibuja con los datos de Laravel. */
  private montarCajita(b: CajitaPayphone): void {
    if (!isPlatformBrowser(this.platform)) return;
    if (!document.querySelector(`link[href="${b.css_url}"]`)) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = b.css_url;
      document.head.appendChild(css);
    }
    const dibujar = () => {
      if (!window.PPaymentButtonBox) {
        this.error.set('No pudimos cargar la caja de pago de PayPhone. Inténtalo de nuevo.');
        this.estado.set('error');
        return;
      }
      const contenedor = document.getElementById('pp-button');
      if (contenedor) contenedor.innerHTML = '';
      new window.PPaymentButtonBox({
        token: b.token, storeId: b.store_id, clientTransactionId: b.client_transaction_id,
        amount: b.amount, amountWithoutTax: b.amount_without_tax, currency: b.currency, reference: b.reference,
        email: b.email, phoneNumber: b.phone_number, documentId: b.document_id,
        identificationType: b.identification_type, lang: b.lang, timeZone: b.time_zone,
      }).render('pp-button');
    };
    if (window.PPaymentButtonBox) return dibujar();
    const existente = document.querySelector<HTMLScriptElement>(`script[src="${b.js_url}"]`);
    const script = existente ?? Object.assign(document.createElement('script'), { type: 'module', src: b.js_url });
    script.addEventListener('load', dibujar, { once: true });
    script.addEventListener('error', () => { this.error.set('No pudimos cargar la caja de pago de PayPhone. Revisa tu conexión.'); this.estado.set('error'); }, { once: true });
    if (!existente) document.head.appendChild(script);
  }

  // ----- Solo con el modo de pruebas de Laravel (desarrollo): simula lo que PayPhone devolvería -----
  simular(aprobado: boolean): void {
    const cx = this.intento()?.client_transaction_id;
    if (!cx) return;
    this.router.navigate([this.RUTA_RESPUESTA], { queryParams: { id: aprobado ? Date.now() : 1, clientTransactionId: cx } });
  }
}
