// ===== EDITABLE: configuración de DESARROLLO (ng serve) =====
// Laravel con `php artisan serve` corre en el puerto 8000. Su CORS (FRONTEND_URL en el .env del backend)
// debe incluir http://localhost:4200. Se usa 127.0.0.1 (y no localhost) porque el servidor SSR de Node en Windows
// resuelve localhost a IPv6 (::1) y artisan serve escucha en IPv4: la petición se queda colgada.
export const environment = {
  apiUrl: 'http://127.0.0.1:8000/api/v1',
};
