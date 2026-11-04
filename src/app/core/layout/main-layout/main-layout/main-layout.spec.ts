import { Router, provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainLayout } from './main-layout';

describe('MainLayout', () => {
  let component: MainLayout;
  let fixture: ComponentFixture<MainLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('el botón flotante de WhatsApp aparece en la tienda y no en el checkout ni en el pedido pendiente', async () => {
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/catalogo');
    expect(component.mostrarWhatsapp()).toBe(true);

    for (const url of ['/checkout', '/checkout/pago', '/checkout/confirmacion', '/pedido/abc123']) {
      await router.navigateByUrl(url);
      expect(component.mostrarWhatsapp()).toBe(false);
    }

    await router.navigateByUrl('/carrito');
    expect(component.mostrarWhatsapp()).toBe(true);
  });
});
