import { TestBed } from '@angular/core/testing';
import { AccesorioColocado } from '../../../personalizador/dominio/Accesorios';
import { EscenaMaceta, VistaMaceta } from './vista-maceta';

const GAFAS: AccesorioColocado = { id: 1, accesorioId: 20, nombre: 'Gafas', imagen: 'http://api/media/gafas.webp', x: 30, y: 12, ancho: 40, alto: 10, tipo: 'imagen', rotZ: 15, espejo: true };
const GATO: AccesorioColocado = { id: 2, accesorioId: 7, nombre: 'Gato', imagen: 'http://api/media/gato.webp', x: 60, y: 70, ancho: 20, alto: 20, tipo: 'imagen' };
const NOMBRE: AccesorioColocado = { id: 3, accesorioId: 21, nombre: 'Nombre', imagen: '', x: 20, y: 85, ancho: 50, alto: 8, tipo: 'texto', texto: 'Ingrese su nombre.' };

const ESCENA: EscenaMaceta = {
  imagenBase: 'http://api/media/base.webp', ajuste: { escala: 110, x: -2, y: 4 }, accesorios: [GATO, GAFAS, NOMBRE],
  nombre: 'Dra. Ana', colorTexto: '#111111', tintes: { 20: '#6b3f1d' },
};

function montar(escena: EscenaMaceta) {
  TestBed.configureTestingModule({ imports: [VistaMaceta] });
  const f = TestBed.createComponent(VistaMaceta);
  f.componentRef.setInput('escena', escena);
  f.detectChanges();
  return f.nativeElement as HTMLElement;
}

describe('VistaMaceta (la maceta con sus accesorios, sin canvas ni descargas nuevas)', () => {
  it('pinta la foto base con su encuadre y cada accesorio en su lugar, tamaño y rotación (en %)', () => {
    const html = montar(ESCENA);

    expect(html.querySelector<HTMLImageElement>('img.maceta')!.src).toBe('http://api/media/base.webp');
    expect(html.querySelector<HTMLElement>('img.maceta')!.style.transform).toBe('translate(-2%, 4%) scale(1.1)');

    const cajas = Array.from(html.querySelectorAll<HTMLElement>('.accesorio'));
    expect(cajas.length).toBe(3);
    expect(cajas[1].style.left).toBe('30%');
    expect(cajas[1].style.top).toBe('12%');
    expect(cajas[1].style.width).toBe('40%');
    expect(cajas[1].style.height).toBe('10%');
    expect(cajas[1].querySelector<HTMLElement>('.contenido-3d')!.style.transform).toContain('rotateZ(15deg) scaleX(-1)');
    // de atrás hacia adelante
    expect(cajas.map(c => c.style.zIndex)).toEqual(['1', '2', '3']);
  });

  it('el nombre sale en la placa con el nombre de la persona y el color del producto', () => {
    const html = montar(ESCENA);
    const placa = html.querySelector('app-texto-placa')!;

    expect(placa.textContent).toContain('Dra. Ana');
    expect(placa.querySelector('text')!.getAttribute('fill')).toBe('#111111');
  });

  it('con el nombre vacío usa el texto de ejemplo del accesorio', () => {
    expect(montar({ ...ESCENA, nombre: '' }).querySelector('app-texto-placa')!.textContent).toContain('Ingrese su nombre.');
  });

  it('los lentes y las gafas se pintan de su color con un filtro; los demás accesorios no se tocan', () => {
    const html = montar(ESCENA);
    const imagenes = Array.from(html.querySelectorAll<HTMLImageElement>('.accesorio img'));
    const gafas = imagenes.find(i => i.src.includes('gafas'))!;
    const gato = imagenes.find(i => i.src.includes('gato'))!;

    const id = /url\("?#([^")]+)"?\)/.exec(gafas.style.filter)![1];
    const filtro = html.querySelector(`filter[id="${id}"]`)!;
    expect(filtro.querySelector('feFlood')!.getAttribute('flood-color')).toBe('#6b3f1d');
    expect(gato.style.filter).toBe('');
  });

  it('sin lentes ni gafas no agrega filtros', () => {
    expect(montar({ ...ESCENA, accesorios: [GATO], tintes: {} }).querySelector('filter')).toBeNull();
  });
});
