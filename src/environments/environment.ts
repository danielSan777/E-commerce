// ===== EDITABLE: configuración de PRODUCCIÓN — UN SOLO LUGAR =====
// Angular no usa archivos .env: todo lo que va aquí termina dentro del JavaScript que descarga el navegador,
// así que NUNCA pongas contraseñas ni claves secretas. Solo direcciones públicas.
export const environment = {
  /** Dirección de la API de Laravel. La API vive en el subdominio api.jardindesele.com; sus rutas empiezan por /api/v1.
   *  (Si algún día queda en el mismo dominio que la web, bastaría '/api/v1'.) */
  apiUrl: 'https://api.jardindesele.com/api/v1',
};
