import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Catalogo } from './catalogo';

describe('Catalogo', () => {
  let component: Catalogo;
  let fixture: ComponentFixture<Catalogo>;

  beforeEach(async () => {
    // jsdom no trae matchMedia
    window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() { }, removeEventListener() { }, addListener() { }, removeListener() { }, onchange: null, dispatchEvent: () => false })) as typeof window.matchMedia;
    await TestBed.configureTestingModule({
      imports: [Catalogo],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Catalogo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
