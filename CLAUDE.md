# Jardín de Sele — instrucciones para Claude

## Fuente de verdad
- Reglas de negocio y orden de trabajo: docs/documento-maestro.md. Lee el paso completo antes de proponer cambios.
- Si el código contradice el documento, gana el documento: señala la diferencia.
- No construyas nada de "Fuera del lanzamiento — NO construir todavía".
- Si algo está en "Decisiones abiertas — NO INVENTAR" o no está definido, pregunta.

## Stack
- Frontend: Angular 22 con SSR (Express).
- Backend: Laravel con PHP 8.4.27+ u 8.5.12+ y MariaDB (carpeta que defina el desarrollador).
- Hosting: Hostinger Unlimited, con Cloudflare delante.

## Reglas que nunca se rompen
- Laravel calcula; Angular representa. Ningún componente calcula precios, envío, recargo, fechas ni disponibilidad.
- Dinero en centavos enteros. Instantes en UTC; fechas de negocio en America/Guayaquil.
- Ningún secreto en Angular.
- Datos de referencia (INEC, países) dentro del proyecto, sin APIs externas.
- Seguir las convenciones del código existente (nombres en español).

## Cómo trabajamos
1. Plan corto antes de programar: archivos a tocar y pruebas a escribir.
2. Pruebas a partir de "Terminado cuando" y "Pruebas" del paso.
3. Antes de terminar: ng test, build con SSR y, cuando exista, php artisan test.
4. Marcar en el documento solo lo terminado.
