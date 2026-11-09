import { Rol } from '../dominio/interfaces/sesion';

/**
 * A dónde ir después de ingresar. Solo rutas internas (nunca otro sitio). El cliente no vuelve a /admin;
 * sin pantalla pedida, el administrador va a su panel y el cliente a su cuenta.
 */
export function destinoSeguro(returnUrl: string | null, rol: Rol): string {
  const porDefecto = rol === 'admin' ? '/admin' : '/mi-cuenta';
  if (!returnUrl || !/^\/(?![/\\])/.test(returnUrl)) return porDefecto;
  if (/^\/(ingresar|crear-cuenta)(\/|\?|#|$)/.test(returnUrl)) return porDefecto;
  if (rol !== 'admin' && /^\/admin(\/|\?|#|$)/.test(returnUrl)) return porDefecto;
  return returnUrl;
}
