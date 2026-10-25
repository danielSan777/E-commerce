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

  it('renders the five category cards with their images', () => {
    const tarjetas = fixture.nativeElement.querySelectorAll('.categoria');

    expect(tarjetas.length).toBe(5);
    expect(tarjetas[0].querySelector('img').getAttribute('alt')).toBe('Family');
  });

  it('starts at the first category and allows moving right', () => {
    const botones = fixture.nativeElement.querySelectorAll('.categorias-controles button');

    expect(botones[0].disabled).toBe(true);
    expect(botones[1].disabled).toBe(false);
  });
});
