import { Component, afterNextRender, inject, signal } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CarritoService } from '../../../../carrito/aplicacion/servicios/CarritoService';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';
import { PagoTarjetaService } from '../../../aplicacion/servicios/PagoTarjetaService';
import { PedidoService } from '../../../aplicacion/servicios/PedidoService';
import { ResultadoDelPago } from '../../../dominio/interfaces/pago_tarjeta';

type Estado =
  | { tipo: 'confirmando' }
  | { tipo: 'rechazado' | 'revision' | 'error'; mensaje: string }
  | { tipo: 'sin_datos' };

/**
 * Paso 13: ruta de respuesta de PayPhone. Recibe `id` y `clientTransactionId`, se los pasa a Laravel y Laravel confirma
 * con PayPhone (en menos de 5 minutos). Angular solo muestra el resultado: aprobado → confirmación; si no, error amable.
 */
@Component({
  selector: 'app-respuesta-payphone',
  imports: [RouterLink],
  templateUrl: './respuesta-payphone.html',
  styleUrl: './respuesta-payphone.css',
})
export class RespuestaPayphone {
  readonly RUTA_CONFIRMACION = '/checkout/confirmacion';
  readonly RUTA_TARJETA = '/checkout/tarjeta';
  readonly RUTA_PAGO = '/checkout/pago';

  private ruta = inject(ActivatedRoute);
  private router = inject(Router);
  private pagos = inject(PagoTarjetaService);
  private pedidos = inject(PedidoService);
  private carrito = inject(CarritoService);

  estado = signal<Estado>({ tipo: 'confirmando' });
  private id = 0;
  private clientTransactionId = '';

  constructor() {
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
    afterNextRender(() => {
      const q = this.ruta.snapshot.queryParamMap;
      this.id = Number(q.get('id'));
      this.clientTransactionId = q.get('clientTransactionId') ?? '';
      if (!Number.isInteger(this.id) || this.id < 1 || !this.clientTransactionId) {
        this.estado.set({ tipo: 'sin_datos' });
        return;
      }
      this.pedidos.restaurar();
      this.confirmar();
    });
  }

  /** Vuelve a pedir la confirmación (si PayPhone o la red fallaron, el intento sigue pendiente en Laravel). */
  confirmar(): void {
    this.estado.set({ tipo: 'confirmando' });
    this.pagos.confirmar(this.id, this.clientTransactionId).subscribe({
      next: r => {
        if (r.result === 'approved') return this.aprobado(r.order_number, r.token, r.simulated);
        const tipo: Record<Exclude<ResultadoDelPago, 'approved'>, 'rechazado' | 'revision' | 'error'> = { declined: 'rechazado', review: 'revision', error: 'error' };
        this.estado.set({ tipo: tipo[r.result as Exclude<ResultadoDelPago, 'approved'>], mensaje: r.message });
      },
      error: (e: ErrorApi) => this.estado.set({ tipo: 'error', mensaje: e.message }),
    });
  }

  private aprobado(numero: string, token: string | null, simulado: boolean): void {
    // Mismo navegador: confirmación con el pedido guardado. Otro navegador: el seguimiento por su enlace privado.
    if (this.pedidos.marcarPagadoConTarjeta(numero, simulado)) {
      this.router.navigateByUrl(this.RUTA_CONFIRMACION, { replaceUrl: true }).then(ok => { if (ok) this.carrito.vaciar(); });
    } else if (token) {
      this.router.navigateByUrl(`/pedido/${token}`, { replaceUrl: true });
    }
  }
}
