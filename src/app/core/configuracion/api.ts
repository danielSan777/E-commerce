import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

// Dirección base de la API de Laravel. Se cambia en UN solo lugar: src/environments/environment*.ts
// (`ng serve` usa environment.development.ts; `ng build` usa environment.ts). Ningún servicio escribe la URL a mano.
export const API_URL = new InjectionToken<string>('API_URL', { providedIn: 'root', factory: () => environment.apiUrl });
