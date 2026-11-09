import { TestBed } from '@angular/core/testing';
import { Avisos } from './avisos';
import { AvisosService } from './AvisosService';

describe('Avisos (mensajes flotantes)', () => {
  it('muestra el mensaje, tiene el rol correcto y se cierra con la X', async () => {
    TestBed.configureTestingModule({ imports: [Avisos] });
    const servicio = TestBed.inject(AvisosService);
    const fixture = TestBed.createComponent(Avisos);
    servicio.exito('Imagen eliminada.');
    servicio.error('No se pudo guardar.');
    fixture.detectChanges();

    const html = fixture.nativeElement as HTMLElement;
    const avisos = html.querySelectorAll('.aviso-flotante');
    expect(avisos.length).toBe(2);
    expect(avisos[0].textContent).toContain('Imagen eliminada.');
    expect(avisos[0].getAttribute('role')).toBe('status');
    expect(avisos[1].getAttribute('role')).toBe('alert');

    (html.querySelector('.cerrar') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(html.querySelectorAll('.aviso-flotante').length).toBe(1);
  });
});
