import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pago } from './pago';

describe('Pago', () => {
  let component: Pago;
  let fixture: ComponentFixture<Pago>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pago],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Pago);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
