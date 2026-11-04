import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetalleProducto } from './detalle-producto';

describe('DetalleProducto', () => {
  let component: DetalleProducto;
  let fixture: ComponentFixture<DetalleProducto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleProducto],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalleProducto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('el calendario de fecha futura empieza cerrado y se abre con el botón', () => {
    expect(component.calendarioAbierto()).toBe(false);
    component.calendarioAbierto.set(true);
    expect(component.calendarioAbierto()).toBe(true);
  });
});
