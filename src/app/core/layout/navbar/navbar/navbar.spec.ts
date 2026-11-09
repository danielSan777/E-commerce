import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../../configuracion/api';
import { RESUMEN_CATEGORIAS_API } from '../../../../testing/catalogo-api';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Navbar } from './navbar';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;

  beforeEach(async () => {
    localStorage.clear(); // sin sesión guardada por otras pruebas
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    TestBed.inject(HttpTestingController).expectOne('/api/v1/categories').flush({ data: RESUMEN_CATEGORIAS_API });
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('la cuenta lleva a /ingresar si no hay sesión', () => {
    expect(component.cuentaRuta()).toBe('/ingresar');
    expect(component.cuentaEtiqueta()).toBe('Ingresar');
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
