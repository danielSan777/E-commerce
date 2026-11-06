// ===== EDITABLE: configuración de PRODUCCIÓN — UN SOLO LUGAR =====
// Angular no usa archivos .env: todo lo que va aquí termina dentro del JavaScript que descarga el navegador,
// así que NUNCA pongas contraseñas ni claves secretas. Solo direcciones públicas.
export const environment = {
  /** Dirección de la API de Laravel. `/api/v1` = mismo dominio que la web (jardindesele.com/api/v1).
   *  Si la API queda en otro dominio, escribe la dirección completa: 'https://api.jardindesele.com/api/v1'. */
  apiUrl: '/api/v1',
};
