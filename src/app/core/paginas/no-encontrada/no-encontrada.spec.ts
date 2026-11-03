import { RESPONSE_INIT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoEncontrada } from './no-encontrada';

describe('NoEncontrada (404)', () => {
  it('muestra el 404 y marca la respuesta del servidor con estado 404', async () => {
    const respuesta: ResponseInit = { status: 200 };
    TestBed.configureTestingModule({
      imports: [NoEncontrada],
      providers: [provideRouter([]), { provide: RESPONSE_INIT, useValue: respuesta }],
    });

    const fixture = TestBed.createComponent(NoEncontrada);
    await fixture.whenStable();

    expect(respuesta.status).toBe(404);
    expect(fixture.nativeElement.textContent).toContain('404');
  });
});
