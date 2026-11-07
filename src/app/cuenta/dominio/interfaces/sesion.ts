// Contrato de la API de cuentas (Laravel): POST /api/v1/auth/login y /auth/register
export type Rol = 'customer' | 'admin';

export interface Usuario {
  name: string;
  email: string;
  role: Rol;
}

export interface RespuestaSesion {
  token: string;
  token_type: 'Bearer';
  expires_at: string; // ISO 8601
  user: Usuario;
}

export interface Sesion {
  token: string;
  expires_at: string;
  user: Usuario;
}

export interface DatosRegistro {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

/** Error de la API ya normalizado: `code` estable (decide la lógica) y `message` en español (se muestra tal cual). */
export interface ErrorApi {
  status: number;
  code: string;
  message: string;
  errors?: Record<string, string[]>;
  /** Solo en `category_has_products` (409): los productos que impiden borrar la categoría. */
  products?: { sku: string; slug: string; name: string }[];
  products_count?: number;
}
