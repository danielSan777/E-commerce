import { aCsv } from './csv';

describe('aCsv', () => {
  it('separa con ; , lleva BOM y termina cada fila con salto de línea', () => {
    expect(aCsv([['Pedido', 'Nombre'], ['JDS-1001', 'Ñandú Pérez']])).toBe('﻿Pedido;Nombre\r\nJDS-1001;Ñandú Pérez\r\n');
  });

  it('entrecomilla lo que trae ; comillas o saltos de línea y duplica las comillas', () => {
    expect(aCsv([['a;b', 'dice "hola"', 'dos\nlíneas']])).toBe('﻿"a;b";"dice ""hola""";"dos\nlíneas"\r\n');
  });

  it('un texto que Excel leería como fórmula se neutraliza, pero un número negativo no', () => {
    expect(aCsv([['=SUMA(A1)', '+593', '@x', '-12', '-1,5', '-cuidado']])).toBe("﻿'=SUMA(A1);'+593;'@x;-12;-1,5;'-cuidado\r\n");
  });
});
