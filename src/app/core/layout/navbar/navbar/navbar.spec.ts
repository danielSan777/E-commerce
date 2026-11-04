import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Navbar } from './navbar';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('el menú lleva a Inicio y a las 4 categorías', () => {
    const rutas = component.catalogos().map(c => c.ruta);

    expect(rutas).toEqual(['/', '/profesiones-y-hobbies', '/amor', '/amistad', '/familia']);
  });

  it('los enlaces del menú del celular apuntan a esas direcciones', async () => {
    component.abrir();
    await fixture.whenStable();
    const enlaces = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('.sidebar-enlace'))
      .map(a => a.getAttribute('href'));

    expect(enlaces).toContain('/amor');
    expect(enlaces).toContain('/profesiones-y-hobbies');
  });
});
