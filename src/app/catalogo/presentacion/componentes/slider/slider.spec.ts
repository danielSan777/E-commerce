import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Slider } from './slider';

describe('Slider', () => {
  let component: Slider;
  let fixture: ComponentFixture<Slider>;

  beforeEach(async () => {
    // jsdom no trae matchMedia
    window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() { }, removeEventListener() { }, addListener() { }, removeListener() { }, onchange: null, dispatchEvent: () => false })) as typeof window.matchMedia;

    await TestBed.configureTestingModule({
      imports: [Slider],
    }).compileComponents();

    fixture = TestBed.createComponent(Slider);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
