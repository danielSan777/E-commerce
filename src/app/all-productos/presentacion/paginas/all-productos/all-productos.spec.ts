import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AllProductos } from './all-productos';

describe('AllProductos', () => {
  let component: AllProductos;
  let fixture: ComponentFixture<AllProductos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllProductos],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AllProductos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
