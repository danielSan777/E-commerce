import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Personalizador } from './personalizador';

describe('Personalizador', () => {
  let component: Personalizador;
  let fixture: ComponentFixture<Personalizador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Personalizador],
    }).compileComponents();

    fixture = TestBed.createComponent(Personalizador);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
