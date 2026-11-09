// Validación de los formularios de cuenta ANTES de llamar a la API (campos vacíos y formato).
// Laravel sigue validando todo de nuevo: esto solo evita viajes inútiles y da respuesta inmediata.
export type Errores = Record<string, string>;

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarIngreso(email: string, password: string): Errores {
  const e: Errores = {};
  if (!email.trim()) e['email'] = 'Escribe tu correo.';
  else if (!CORREO.test(email.trim())) e['email'] = 'Escribe un correo válido.';
  if (!password) e['password'] = 'Escribe tu contraseña.';
  return e;
}

export function validarRegistro(d: { name: string; email: string; password: string; confirmacion: string }): Errores {
  const e: Errores = {};
  if (!d.name.trim()) e['name'] = 'Escribe tu nombre.';
  else if (d.name.trim().length < 2) e['name'] = 'Escribe tu nombre completo.';
  if (!d.email.trim()) e['email'] = 'Escribe tu correo.';
  else if (!CORREO.test(d.email.trim())) e['email'] = 'Escribe un correo válido.';
  if (!d.password) e['password'] = 'Escribe una contraseña.';
  else if (d.password.length < 8) e['password'] = 'La contraseña debe tener al menos 8 caracteres.';
  if (!d.confirmacion) e['confirmacion'] = 'Repite la contraseña.';
  else if (d.password && d.confirmacion !== d.password) e['confirmacion'] = 'Las contraseñas no coinciden.';
  return e;
}
