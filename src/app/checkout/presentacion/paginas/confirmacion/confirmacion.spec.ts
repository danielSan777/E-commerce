import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { Confirmacion } from './confirmacion';
import { NuevoPedido, PedidoService } from '../../../aplicacion/servicios/PedidoService';
import { DatosCheckout } from '../../../aplicacion/servicios/CheckoutService';
import { ItemCarrito } from '../../../../carrito/aplicacion/servicios/CarritoService';

const item = (uid: string, nombre: string, vista: string): ItemCarrito => ({
  uid, tipo: 'personalizado', producto: { id: uid, nombre, precio: 25 }, vista, ruta: '', resumen: [],
  configuracion: { accesorios: [], nombre: '', colorLentes: 'negro', colorGafas: 'negro', dedicatoria: '', textoMarco: '', sinTarjeta: true, fotoMarcoNombre: '' },
});

function pedido(items: ItemCarrito[]): NuevoPedido {
  return {
    metodo: 'transferencia', items, datos: { metodoPago: 'transferencia' } as DatosCheckout,
    subtotal: 25, envio: 3.5, envioGratis: false, recargo: 0, total: 28.5,
    entrega: { tipo: 'inmediata', window: { start: '2026-11-12', end: '2026-11-13' }, label: 'x', promise_token: 't' },
  };
}

async function montar(items: ItemCarrito[]) {
  TestBed.configureTestingModule({ imports: [Confirmacion], providers: [provideRouter([])] });
  TestBed.inject(PedidoService).crear(pedido(items));
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

  it('ofrece descargar la foto de cada maceta personalizada con un nombre de archivo claro', async () => {
    const { html } = await montar([item('a', 'Amigo guitarrista', 'data:image/jpeg;base64,AAAA'), item('b', 'Sin foto', '')]);
    const enlaces = Array.from(html.querySelectorAll<HTMLAnchorElement>('a.descargar'));

    expect(enlaces.length).toBe(1);
    expect(enlaces[0].getAttribute('href')).toBe('data:image/jpeg;base64,AAAA');
    expect(enlaces[0].getAttribute('download')).toMatch(/^jardin-de-sele-JDS-\d+-amigo-guitarrista\.jpg$/);
    expect(enlaces[0].textContent).toContain('Amigo guitarrista');
  });

  it('no muestra la sección de descarga si ningún producto tiene foto', async () => {
    const { html } = await montar([item('a', 'Doctor', '')]);
    expect(html.querySelector('.fotos-pedido')).toBeNull();
  });
});
