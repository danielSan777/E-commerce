import { validarIngreso, validarRegistro } from './validacion';

describe('validarIngreso', () => {
  it('correo y contraseña vacíos', () => {
    expect(validarIngreso('', '')).toEqual({ email: 'Escribe tu correo.', password: 'Escribe tu contraseña.' });
    expect(validarIngreso('   ', 'x')).toEqual({ email: 'Escribe tu correo.' });
  });

  it('correo con formato inválido', () => {
    expect(validarIngreso('sin-arroba', 'x')).toEqual({ email: 'Escribe un correo válido.' });
    expect(validarIngreso('a@b', 'x')).toEqual({ email: 'Escribe un correo válido.' });
  });

  it('datos correctos no tienen errores', () => {
    expect(validarIngreso(' ana@correo.com ', 'clave')).toEqual({});
  });
});

describe('validarRegistro', () => {
  const ok = { name: 'Ana Pérez', email: 'ana@correo.com', password: 'clave-segura-1', confirmacion: 'clave-segura-1' };

  it('todo vacío', () => {
    expect(Object.keys(validarRegistro({ name: '', email: '', password: '', confirmacion: '' }))).toEqual(['name', 'email', 'password', 'confirmacion']);
  });

  it('contraseña corta y confirmación distinta', () => {
    expect(validarRegistro({ ...ok, password: 'corta', confirmacion: 'corta' })).toEqual({ password: 'La contraseña debe tener al menos 8 caracteres.' });
    expect(validarRegistro({ ...ok, confirmacion: 'otra-distinta' })).toEqual({ confirmacion: 'Las contraseñas no coinciden.' });
  });

  it('datos correctos no tienen errores', () => {
    expect(validarRegistro(ok)).toEqual({});
  });
});
