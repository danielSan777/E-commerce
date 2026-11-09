import { destinoSeguro } from './destino';

describe('destinoSeguro', () => {
  it('sin pantalla pedida: el administrador va a su panel y el cliente a su cuenta', () => {
    expect(destinoSeguro(null, 'admin')).toBe('/admin');
    expect(destinoSeguro(null, 'customer')).toBe('/mi-cuenta');
  });

  it('vuelve a rutas internas', () => {
    expect(destinoSeguro('/consultar-pedido', 'customer')).toBe('/consultar-pedido');
    expect(destinoSeguro('/admin/pedidos/5', 'admin')).toBe('/admin/pedidos/5');
  });

  it('un cliente nunca vuelve a /admin', () => {
    expect(destinoSeguro('/admin', 'customer')).toBe('/mi-cuenta');
    expect(destinoSeguro('/admin/pedidos/5', 'customer')).toBe('/mi-cuenta');
  });

  it('rechaza otros sitios y las propias pantallas de ingreso', () => {
    for (const malo of ['https://malo.com', '//malo.com', '/\\malo.com', 'javascript:alert(1)', '/ingresar', '/crear-cuenta?x=1']) {
      expect(destinoSeguro(malo, 'admin')).toBe('/admin');
      expect(destinoSeguro(malo, 'customer')).toBe('/mi-cuenta');
    }
  });

  it('no confunde rutas que solo empiezan parecido', () => {
    expect(destinoSeguro('/administrador-falso', 'customer')).toBe('/administrador-falso');
  });
});
