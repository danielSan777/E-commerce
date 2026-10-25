import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MuestraTodosProductos } from './muestra-todos-productos';

describe('MuestraTodosProductos', () => {
  let component: MuestraTodosProductos;
  let fixture: ComponentFixture<MuestraTodosProductos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MuestraTodosProductos],
    }).compileComponents();

    fixture = TestBed.createComponent(MuestraTodosProductos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
