// Contrato de la API de administración (Laravel): POST /api/v1/admin/login
export interface UsuarioAdmin {
  name: string;
  email: string;
}

export interface RespuestaLogin {
  token: string;
  token_type: 'Bearer';
  expires_at: string; // ISO 8601
  user: UsuarioAdmin;
}

export interface SesionAdmin {
  token: string;
  expires_at: string;
  user: UsuarioAdmin;
}

/** Error de la API ya normalizado: `code` estable (decide la lógica) y `message` en español (se muestra tal cual). */
export interface ErrorApi {
  status: number;
  code: string;
  message: string;
  errors?: Record<string, string[]>;
}
