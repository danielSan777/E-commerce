import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../../../core/configuracion/api';
import { CHECKOUT_API, TOKEN_PRUEBA } from '../../../../testing/pedido-api';
import { Confirmacion } from './confirmacion';
import { NuevoPedido, PedidoService } from '../../../aplicacion/servicios/PedidoService';
import { DatosCheckout } from '../../../aplicacion/servicios/CheckoutService';
import { ItemCarrito } from '../../../../carrito/aplicacion/servicios/CarritoService';

const item = (uid: string, nombre: string, vista: string): ItemCarrito => ({
  uid, tipo: 'personalizado', producto: { id: uid, nombre, precio: 25 }, vista, ruta: '', resumen: [],
  configuracion: { accesorios: [], nombre: '', colorLentes: 'negro', colorGafas: 'negro', dedicatoria: '', textoMarco: '', sinTarjeta: true, fotoMarcoNombre: '' },
});

function pedido(items: ItemCarrito[], metodo: 'transferencia' | 'payphone' = 'transferencia'): NuevoPedido {
  return {
    metodo, items, datos: { metodoPago: metodo, correo: 'cliente@correo.com', provincia: 'Guayas', canton: 'Durán' } as DatosCheckout,
    subtotal: 25, envio: 3.5, envioGratis: false, recargo: 0, total: 28.5,
    entrega: { tipo: 'inmediata', window: { start: '2026-11-12', end: '2026-11-13' }, label: 'x', promise_token: 't' },
  };
}

async function montar(items: ItemCarrito[], metodo: 'transferencia' | 'payphone' = 'transferencia', simulado = true) {
  TestBed.configureTestingModule({
    imports: [Confirmacion],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }],
  });
  TestBed.inject(PedidoService).crear(pedido(items, metodo)).subscribe();
  TestBed.inject(HttpTestingController).expectOne('/api/v1/checkout').flush(CHECKOUT_API, { status: 201, statusText: 'Created' });
  if (metodo === 'payphone') TestBed.inject(PedidoService).marcarPagadoConTarjeta(CHECKOUT_API.order_number, simulado);
  const fixture = TestBed.createComponent(Confirmacion);
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, html: fixture.nativeElement as HTMLElement };
}

describe('Confirmacion', () => {
  beforeEach(() => sessionStorage.clear());

  it('should create', async () => {
    TestBed.configureTestingModule({ imports: [Confirmacion], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Confirmacion);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('avisa a qué correo se envió el pedido con el enlace de seguimiento', async () => {
    const { html } = await montar([item('a', 'Doctor', '')]);
    const aviso = html.querySelector('.aviso-correo')?.textContent ?? '';

    expect(aviso).toContain('Te enviamos un correo a cliente@correo.com');
    expect(aviso).toContain('spam');
  });

  it('transferencia: número, plazo y cuentas vienen de Laravel', async () => {
    const { html } = await montar([item('a', 'Doctor', '')]);

    expect(html.textContent).toContain('JDS-48213');
    expect(html.textContent).toContain('Paga antes del martes 3 de noviembre, 23:00');
    expect(html.textContent).toContain('JOSUE DE SANTIS');
    expect(html.textContent).toContain('Banco Nuevo Andino');
  });

  it('el botón de WhatsApp usa el enlace de Laravel (registra el clic) y el mensaje lleva el enlace del pedido', async () => {
    const { html } = await montar([item('a', 'Doctor', '')]);
    const boton = Array.from(html.querySelectorAll<HTMLAnchorElement>('a.btn-primario')).find(a => a.textContent?.includes('WhatsApp'));

    expect(boton?.getAttribute('href')).toBe(CHECKOUT_API.order.whatsapp_url);
    expect(html.querySelector('.mensaje-texto')?.textContent).toContain(`/pedido/${TOKEN_PRUEBA}`);
  });

  it('PayPhone aprobado: muestra pago confirmado, sin comprobante por WhatsApp', async () => {
    const { html } = await montar([item('a', 'Doctor', '')], 'payphone');

    expect(html.textContent).toContain('Pago simulado');   // en pruebas Laravel avisa que fue simulado
    expect(html.textContent).not.toContain('Subir comprobante por WhatsApp');
    const ver = Array.from(html.querySelectorAll<HTMLAnchorElement>('a.btn')).find(a => a.textContent?.includes('Ver el estado de mi pedido'));
    expect(ver?.getAttribute('href')).toBe(`/pedido/${TOKEN_PRUEBA}`);   // desde aquí el cliente ve el estado de su pedido
  });


  it('PayPhone real aprobado: no dice que el pago fue simulado ni que el cobro llegará después', async () => {
    const { html } = await montar([item('a', 'Doctor', '')], 'payphone', false);

    expect(html.textContent).toContain('Pago confirmado');
    expect(html.textContent).toContain('Pago con tarjeta aprobado por PayPhone');
    expect(html.textContent).not.toContain('Pago simulado');
    expect(html.textContent).not.toContain('llegará con el servidor');
  });

  it('ofrece descargar la foto de cada maceta personalizada con un nombre de archivo claro', async () => {
    const { html } = await montar([item('a', 'Amigo guitarrista', 'data:image/jpeg;base64,AAAA'), item('b', 'Sin foto', '')]);
    const enlaces = Array.from(html.querySelectorAll<HTMLAnchorElement>('a.descargar'));

    expect(enlaces.length).toBe(1);
    expect(enlaces[0].getAttribute('href')).toBe('data:image/jpeg;base64,AAAA');
    expect(enlaces[0].getAttribute('download')).toMatch(/^jardin-de-sele-JDS-\d+-amigo-guitarrista\.jpg$/);
    expect(enlaces[0].textContent).toContain('Descargar foto de tu maceta');
    // El botón queda dentro del producto, en el resumen
    const productos = html.querySelectorAll('.producto');
    expect(productos[0].querySelector('a.descargar')).not.toBeNull();
    expect(productos[1].querySelector('a.descargar')).toBeNull();
  });

  it('no muestra la sección de descarga si ningún producto tiene foto', async () => {
    const { html } = await montar([item('a', 'Doctor', '')]);
    expect(html.querySelector('a.descargar')).toBeNull();
  });
});
