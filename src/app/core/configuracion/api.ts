import { InjectionToken } from '@angular/core';

// Dirección base de la API de Laravel. En producción Laravel y Angular comparten dominio (`/api`);
// en desarrollo `ng serve` redirige `/api` a Laravel con proxy.conf.json. No lleva ningún secreto.
export const API_URL = new InjectionToken<string>('API_URL', { providedIn: 'root', factory: () => '/api/v1' });
