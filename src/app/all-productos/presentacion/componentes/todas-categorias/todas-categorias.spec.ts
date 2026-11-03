import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TodasCategorias } from './todas-categorias';

describe('TodasCategorias', () => {
  let component: TodasCategorias;
  let fixture: ComponentFixture<TodasCategorias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodasCategorias],
    }).compileComponents();

    fixture = TestBed.createComponent(TodasCategorias);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders one card per category with its image', () => {
    const tarjetas = fixture.nativeElement.querySelectorAll('.categoria');

    expect(tarjetas.length).toBe(component.categorias.length);
    expect(tarjetas[0].querySelector('img')).toBeTruthy();
  });

  it('starts at the first category and allows moving right', () => {
    const botones = fixture.nativeElement.querySelectorAll('.categorias-controles button');

    expect(botones[0].disabled).toBe(true);
    expect(botones[1].disabled).toBe(false);
  });
});
