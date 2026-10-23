import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dedicatoria } from './dedicatoria';

describe('Dedicatoria', () => {
  let component: Dedicatoria;
  let fixture: ComponentFixture<Dedicatoria>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dedicatoria],
    }).compileComponents();

    fixture = TestBed.createComponent(Dedicatoria);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
