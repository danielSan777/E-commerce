import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnvioFacturacion } from './envio-facturacion';

describe('EnvioFacturacion', () => {
  let component: EnvioFacturacion;
  let fixture: ComponentFixture<EnvioFacturacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnvioFacturacion],
    }).compileComponents();

    fixture = TestBed.createComponent(EnvioFacturacion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
