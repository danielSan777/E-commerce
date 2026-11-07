# Jardín de Sele — Documento Maestro de construcción

Nov 2, 2026 · @Sele

Este documento es la única fuente de verdad para construir y lanzar la web de Jardín de Sele: una tienda completa con pago con tarjeta por PayPhone, transferencia y medición para publicidad. Define el alcance del lanzamiento, la lógica de negocio de cada pantalla y el orden de construcción, del Paso 0 al Paso 27. Regla base: **Laravel calcula; Angular representa.**

## Empieza aquí

**Dónde estamos (2 de noviembre de 2026).** El frontend tiene catálogo, ficha, personalizador, carrito y las tres pantallas del checkout con datos de prueba. El backend no existe todavía. **Lo siguiente es el Paso 1B** (correcciones de la revisión del 2 de noviembre) y después seguir el orden del Paso 1.

**Para el desarrollador**

1. Lee la guía de arranque y el alcance del lanzamiento.
2. Exporta este documento en Markdown y guárdalo en el repositorio como `docs/documento-maestro.md`. Cuando Josué avise de una actualización, se vuelve a exportar.
3. Crea `CLAUDE.md` en la raíz con la plantilla de la guía de arranque.
4. Trabaja un paso por sesión con el mensaje base. Empieza por el Paso 1B.
5. Cada viernes, muestra el avance a Josué (en staging cuando exista; antes, en local o en la web actual).

**Para Claude (la IA del desarrollador)**

- Este documento es la fuente de verdad del negocio. Si el código actual lo contradice, gana el documento; señala la diferencia y propón el cambio.
- Antes de proponer cambios, lee el paso completo y las secciones "Alcance del lanzamiento", "Fuera del lanzamiento — NO construir todavía" y "Decisiones abiertas — NO INVENTAR".
- Las reglas escritas como "si pasa esto, entonces aquello" y sus ejemplos se convierten en pruebas automáticas.
- Laravel calcula y Angular representa: ningún componente calcula precios, envío, recargo, fechas ni disponibilidad. Mientras no exista el backend, esos valores vienen de mocks con la forma exacta del Paso 0.
- Los datos de referencia (provincias, cantones, localidades, países) viven dentro del proyecto; no se usan servicios externos gratuitos para ellos.
- Lo marcado "NO CAMBIAR" no se modifica sin que el desarrollador lo confirme con Josué.
- Si el documento no resuelve una duda, pregunta; no inventes.

## Cómo usar este documento

- **Qué es.** Reúne, en orden de construcción, todas las decisiones funcionales, operativas y técnicas acordadas con Josué. Cada regla de negocio está escrita como "si pasa esto, entonces aquello", con ejemplos que deben convertirse en pruebas automáticas.
- **Cómo se trabaja.** Basta con decir "Estamos en el Paso N del Documento Maestro" para que el desarrollador y su IA tengan el contexto completo de ese paso (ver la guía de arranque).
- **Alcance.** Se construye solo lo que está en el alcance del lanzamiento. Lo listado en "Fuera del lanzamiento — NO construir todavía" no se programa, aunque aparezca mencionado como futuro.
- **Decisiones abiertas.** Si algo no está definido o aparece en "Decisiones abiertas — NO INVENTAR", se pregunta a Josué; no se supone.
- **Mejoras y correcciones.** El criterio técnico del desarrollador es parte del proyecto. Si encuentra una falla, omisión, contradicción o una mejor solución, se aplica pensando en el documento completo: identificar qué otros pasos toca, ajustarlos en el mismo cambio y verificar que no abra un hueco en otro punto. El documento se actualiza para seguir siendo la única fuente de verdad.
- **NO CAMBIAR** señala decisiones de negocio acordadas con Josué. Si aparece una razón técnica para revisar alguna, se conversa con él y el cambio se refleja en todos los pasos que afecte.
- **Acción de Josué** marca lo que el propietario debe crear, entregar, decidir o validar. Nunca se le piden contraseñas personales cuando existe invitación, rol, token o acceso limitado.
- **Casillas.** Sirven solo para marcar lo terminado y ver el avance de un vistazo. No reemplazan ni exigen reportes.
- **Orden.** Los Pasos 2, 3 y 4 pueden avanzar mientras se termina el Paso 1. Desde el Paso 5 el orden es secuencial salvo donde se indica. Las pruebas de cada paso se ejecutan en staging antes de pasar al siguiente.

## Guía de arranque

**Herramientas**

| Herramienta | Para qué | Versión o nota |
| --- | --- | --- |
| VS Code (o el editor del desarrollador) | Editar el código | — |
| Git y GitHub | Versiones y repositorio del negocio | Repositorio en la cuenta del negocio (Paso 2) |
| Node.js | Angular y el SSR | La misma versión del servidor de Hostinger, declarada en `.nvmrc` y `engines` |
| Angular CLI | Frontend con SSR | Angular 22, la del repositorio |
| PHP y Composer | Backend | PHP 8.4.27 o superior, u 8.5.12 o superior (parche de PHP2Shell) |
| Laravel | Backend, API, cola y scheduler | Versión con soporte vigente |
| Panel en Angular (decisión del desarrollador) | Panel de administración hecho en Angular que consume `/api/v1/admin/*` de Laravel | Laravel es solo API; sin pantallas en el backend. Sustituye a Filament |
| MariaDB local | Base de datos en desarrollo | La misma versión mayor que Hostinger |
| Claude Code | Programar con IA paso a paso | Flujo abajo |
| hPanel de Hostinger y Cloudflare | Despliegue, correo, DNS y caché | Accesos del Paso 2 |

**Cómo trabajar con Claude Code**

1. Este documento vive en el repositorio como `docs/documento-maestro.md` (exportado en Markdown) y se actualiza cuando cambia.
2. `CLAUDE.md` en la raíz, de menos de 200 líneas: stack, comandos, convenciones y la instrucción de leer el paso del Documento Maestro antes de programar. No copia el documento.
3. Un paso por sesión: primero el plan, después el código, después las pruebas, después staging y al final se marcan las casillas.
4. Las reglas con ejemplos ("con 1 maceta… con 2 macetas…") se convierten en pruebas automáticas junto con el código.
5. Trabajando a tiempo completo, los límites del plan básico de Claude se quedan cortos; conviene un plan superior o créditos de uso durante la construcción.

**Mensaje base para cada paso**

```markdown
Estamos en el Paso N del Documento Maestro (docs/documento-maestro.md).
Lee el Paso N completo, "Alcance del lanzamiento", "Fuera del lanzamiento — NO construir todavía" y "Decisiones abiertas — NO INVENTAR".
Antes de programar, dame un plan corto: archivos a crear o cambiar y las pruebas que escribirás a partir de "Terminado cuando" y "Pruebas".
No construyas nada de "Fuera del lanzamiento". Si algo no está definido, pregunta; no inventes.
```

**Plantilla de `CLAUDE.md`** (el desarrollador la ajusta a su estructura de carpetas)

```markdown
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
```

**Glosario mínimo**

- **SSR:** el servidor entrega la página ya armada; Google y WhatsApp la leen completa.
- **API:** las direcciones con las que Angular pide datos y cálculos a Laravel.
- **Migración y seeder:** archivos que crean las tablas y cargan datos iniciales o de prueba.
- **Cola y scheduler:** trabajos en segundo plano (correos, eventos) y tareas programadas que corren cada minuto.
- **Staging:** copia privada de la web para probar antes de producción.
- **Slot:** posición de un accesorio sobre la maceta. **Zona:** grupo de destinos con la misma tarifa de envío.

## Mapa de fases y calendario

Las metas son estimaciones con el desarrollador a tiempo completo y se revisan cada viernes con una demostración en staging.

| Fase | Pasos | Resultado | Meta estimada |
| --- | --- | --- | --- |
| 1. Frontend con datos de prueba | 0 y 1 (2 en paralelo) | Todas las pantallas con mocks, incluidas la página principal y la pantalla de categorías | Mediados de noviembre de 2026 |
| 2. Base, catálogo y reglas | 3 a 12 y 14 | Staging, Laravel, panel de productos, medios, precios, ciclos, promesa, zonas, carrito, creación del pedido y transferencia | Mediados de diciembre de 2026 |
| 3. Pagos y operación | 13 y 15 a 19 | PayPhone, pedidos, seguimiento, correos, avisos y panel de operación | Inicios de enero de 2027 |
| 4. Medición, SEO y confianza | 20 a 25 | Tracking, catálogo de Meta, SEO, políticas, testimonios, backups, monitoreo y página de San Valentín lista | Inicios de enero de 2027 |
| 5. QA y lanzamiento | 26 y 27 | Pruebas en celulares reales y compra real | Mediados de enero de 2027 |

**Punto de control:** si a mediados de diciembre la Fase 2 no funciona en staging, se recalculan las fechas en ese momento. San Valentín necesita la web lanzada y probada a mediados de enero para pautar a tiempo.

## Alcance del lanzamiento

Se lanza una tienda completa: el comprador elige, personaliza, paga con tarjeta o transferencia y sigue su pedido; Josué opera desde un panel; la publicidad recibe ventas reales.

**Incluye**

- **Vender:** página principal con video y botón a categorías; pantalla de categorías con pestañas de subcategorías; búsqueda; ficha con promesa de entrega y fecha futura; personalizador con todo completo antes de pagar; carrito con segunda maceta y envío gratis; checkout con cédula o RUC y términos; pago con tarjeta (PayPhone, con recargo) y transferencia (12 h); envío por zonas; página de San Valentín como plantilla de temporada; testimonios; seguimiento y correos.
- **Operar:** productos y configurador creados por Josué; promociones con fechas; ciclos, feriados, capacidad, botón para pasar al siguiente ciclo y gracia de 30 minutos; hoja de producción; lista de envíos; "Enviado" por lote; pedidos de WhatsApp en el panel; corrección de pedidos; marca "Facturado"; avisos al administrador; cancelaciones con estado y nota.
- **Publicidad:** píxeles de Meta y TikTok y GA4; compras desde el servidor solo con pago real; catálogo de Meta; campaña y anuncio de origen en cada pedido.
- **Base:** SEO técnico, vista previa al compartir, aviso de cookies, políticas, backups, monitoreo y seguridad.

### Fuera del lanzamiento — NO construir todavía

No se programan hasta que Josué los pida. La arquitectura no debe impedirlos, pero no se les dedica tiempo.

| Cuándo | Qué | Por qué espera |
| --- | --- | --- |
| Apenas se pueda (1–3 meses después) | Reporte de costo por pedido por campaña (gasto importado por CSV) y exportación de clientes a Meta | Los datos se guardan desde el día uno; el reporte solo los ordena |
| Apenas se pueda | Cupones (códigos, límites, lotes) | Las promociones automáticas con fechas cubren el lanzamiento |
| Apenas se pueda | Reseñas verificadas con solicitud automática | Al inicio se muestran testimonios elegidos por Josué |
| Al pasar unos 10 pedidos diarios | Facturación electrónica automática | Hoy la factura se emite a mano y existe la marca "Facturado" |
| Al crecer | Carrito guardado en el servidor y correos de carrito abandonado | El remarketing de Meta cubre ese caso; requiere texto legal |
| Al crecer | "¿Para quién es?", `/regalos`, campo de género y etiquetas de ocasión | Las categorías y las temporadas cubren el uso actual |
| Al crecer | Catálogos de Google y TikTok, y Merchant Center | Solo si se pauta ahí |
| Al crecer | Contador de insumos con alerta, permisos para empleados e importación de compradores antiguos | No hacen falta con el volumen actual |
| Solo con mucho volumen | Centro de tareas con prioridades, motor de mensajes con plantillas e historial, API de WhatsApp, flujo completo de cancelaciones y reembolsos, integración con Servientrega y estado "Entregado", validación automática de transferencias y ~~cuentas de cliente~~ *(las cuentas de cliente se adelantaron por decisión del desarrollador el 2026-11-07: registro, ingreso único con rol y `/mi-cuenta`; el comprador sigue pudiendo comprar y consultar su pedido sin cuenta)* | Automatización para un equipo grande |

**Eliminado del diseño (ya no existe):** información pendiente o "enviar por WhatsApp después"; protección de promesa de 15/60 minutos con señales de actividad; hora de revisión de transferencias, vencimiento a las 72 h y reactivación; pasaporte; agrupación por colección dentro de la categoría (la reemplazan las pestañas); redirección 302 de campañas fuera de temporada; página "Todos los productos" (la reemplaza la pantalla de categorías).

### Estado de partida (auditoría del 30 oct 2026)

- Stack previsto: Angular + Angular SSR (Express) en Hostinger Unlimited, Laravel/PHP, MariaDB, Cloudflare, Git. PayPhone previsto. Configurador 2D propio con slots y overrides. El backend todavía no existe (ver el estado del repositorio abajo).
- El SSR funciona: Google recibe HTML con texto.
- Las rutas no: `/`, `/catalogo` y `/catalogo/profesionales` devuelven la misma portada; `/carrito`, `/cuenta`, `/politicas-privacidad` y otras devuelven "Cannot GET" al entrar directo o recargar.
- No hay meta description, Open Graph, canonical, JSON-LD, sitemap ni tracking (solo Cloudflare Web Analytics).
- La portada pesa \~7,5 MB por PNG de hasta 650 KB sin lazy loading.
- El contenido visible viene de una plantilla de otra tienda (formato de precio "$/.", precios tachados falsos, textos ajenos, Gmail personal en el pie).
- El desarrollador está terminando el frontend funcional del recorrido completo.

### Estado del repositorio (revisión del 2 nov 2026)

- Repositorio `github.com/danielSan777/E-commerce`, rama `main`, último commit revisado `21d30a5` ("pagos", 2 nov). Contiene **solo el frontend** (Angular 22 con SSR sobre Express). **El backend no existe todavía:** no hay Laravel, base de datos, pedidos ni integraciones.
- Hecho con datos de prueba: ficha de producto (parcial); personalizador con slots, elemento fijo, exactamente 2 accesorios, marcos, frase de hasta 60 caracteres y dedicatoria de hasta 250; carrito con la regla de la segunda maceta y envío gratis desde 2 macetas; checkout en tres pantallas (`/checkout`, `/checkout/pago`, `/checkout/confirmacion`) con cédula o RUC validados, recargo del 6% en línea separada y datos de transferencia con botón copiar.
- Pendiente del recorrido: pedido pendiente con subida de comprobante, seguimiento, página principal, pantalla de categorías, búsqueda y plantilla de temporada.
- Correcciones: Paso 1A (arreglos de base) y Paso 1B (contradicciones con este documento encontradas el 2 de noviembre).
- **Glosario:** en el código, "ubicaciones" son las posiciones de los accesorios sobre la maceta; en este documento se llaman **slots**. La ubicación geográfica del envío se llama **zona**.

### Decisión de base: backend en PHP/Laravel sobre Hostinger

- El backend se construye en **Laravel (PHP) con MariaDB, en el plan Hostinger Unlimited que Jardín de Sele ya tiene contratado por 3 años.** Es la opción más eficiente para ese hosting: PHP corre de forma nativa con cron, colas y correo. Las apps Node de Hostinger, en cambio, se detienen cuando no tienen tráfico, lo que complica las tareas programadas y obligaría a contratar y administrar otro tipo de servidor.
- **Seguridad:** en octubre de 2026 se publicó PHP2Shell (CVE-2026-109618 y CVE-2026-109619), una falla grave que afectó a PHP 5.4–8.5. PHP la corrigió el 21 de octubre de 2026 en las versiones 8.2.35, 8.3.36, 8.4.27 y 8.5.12. La protección es usar siempre una versión con soporte y parche al día. Regla del proyecto: PHP 8.4.27 o superior, u 8.5.12 o superior (o la versión parcheada más reciente), Laravel con soporte vigente y revisión mensual de actualizaciones de PHP, Laravel y dependencias.
- Cambiar de lenguaje o de hosting solo se considera ante una razón técnica de mucho peso, documentada y conversada con Josué antes de empezar cualquier trabajo, porque implica perder un hosting ya pagado y rehacer decisiones de todo este documento.

### Imágenes de ejemplo

- Todas las fotos actuales son de ejemplo, usadas para construir la estructura. Josué entregará las fotos reales: cada producto, cada accesorio y **una foto real por cada color de cada gafa y de cada lente**.
- No se invierte tiempo en mejorar fotos de ejemplo. Lo que sí debe quedar listo es la estructura: el configurador muestra **una imagen por variante de color** (no pinta la imagen), para que al llegar las fotos reales solo haya que subir archivos.

### Repositorio a nombre del negocio

- El repositorio está hoy en la cuenta personal del desarrollador. Lo correcto profesionalmente, y lo habitual en proyectos para un cliente, es que el código viva en una cuenta del negocio con el desarrollador como colaborador: el negocio conserva su activo y el desarrollador mantiene todo su acceso para trabajar.
- Se hace con la transferencia de GitHub (Paso 2) y la fecha se coordina con Josué: él crea la cuenta del negocio y el desarrollador transfiere.

### Parámetros iniciales del negocio

Todos se editan desde el panel; ninguno va fijo en el código.

| Parámetro | Valor inicial |
| --- | --- |
| Corte lunes a viernes | 20:00 (inclusive) |
| Corte sábado | 16:00 (inclusive) |
| Domingo | Se vende; no se produce ni se despacha |
| Capacidad nominal por ciclo | 8 pedidos (no macetas) |
| Tolerancia máxima por ciclo | 10 pedidos, solo para gracia, transferencias vistas tarde y excepciones manuales |
| Gracia después del corte | 30 min para quien tocó "Personalizar" antes del corte |
| Pago con tarjeta en curso | Reserva el cupo 15 min |
| Plazo para pagar por transferencia | 12 h desde la creación del pedido |
| Recargo por pago con tarjeta | 6% |
| Precio de referencia de una maceta | $25 (cada producto tiene su precio en el panel) |
| Envío gratis | Desde 2 macetas, en todas las zonas habilitadas; los complementos no cuentan |
| Zona A (Gran Guayaquil y localidades configuradas) | $3,50 |
| Zona B (Amazonía y destinos que Servientrega cobra igual) | $6,25 y +1 día de tránsito |
| Zona C (resto continental habilitado) | $5,00 |
| Origen de las zonas | Cotizador público de Servientrega (4 nov 2026), por cantón del INEC, en `zonas-envio.json` |
| Galápagos | No disponible |
| Nombre en placa | Máximo 30 caracteres contando espacios |
| Frase del marco | Máximo 60 caracteres (validar con una impresión real) |
| Dedicatoria | Máximo 250 caracteres; cada emoji cuenta como 1 |
| Accesorios elegibles por maceta | 2 (configurable por producto) |
| Fotos subidas en personalizaciones no compradas | Se eliminan a los 14 días |

## Paso 0 — Contratos de datos y glosario

**Objetivo.** Fijar la forma exacta de los datos que Laravel entregará, para que los mocks de Angular sean idénticos a la API real y el frontend no se rehaga al conectar el backend.

**Dependencias.** Ninguna. Es el primer paso y se hace antes de seguir metiendo lógica en Angular.

**Tareas**

- [ ] Crear `docs/contratos/` con un archivo por recurso (JSON de ejemplo + tabla de campos).
- [ ] Definir los recursos: producto, categoría con subcategorías, campaña, precio, medios, configurador, cotización del carrito, promesa, ventanas, checkout, pedido, pedido pendiente, pago, estados, tracking y errores.
- [ ] Definir primero checkout, pedido, pedido pendiente y pago, porque son las pantallas que siguen.
- [ ] Unificar los datos de prueba en una sola fuente con la forma de los contratos. Hoy hay productos en `muestra_producto.ts`, `productos.ts` y `carrito.ts`, y accesorios en `configuracion-producto.json` y `carrito.ts` con nombres distintos.
- [ ] Configuración del configurador **por producto** (hoy es una sola, `productoId: 1`), con las variantes de color como imágenes separadas.
- [ ] Exportar las interfaces de dominio (hoy son globales sin `export`) y resolver el choque de nombres de `Producto`.
- [ ] Capa de servicios en Angular (`ProductApi`, `CartApi`, `PromiseApi`, `OrderApi`) que hoy lee mocks y mañana la API, sin tocar los componentes.

**Implementación acordada**

- Laravel calcula precios, descuentos, recargo, envío, totales, fechas, ventanas, capacidad y estados. Angular solo representa.
- Dinero en centavos enteros (`*_cents`), moneda `USD`. Angular solo da formato ("$25,00").
- Instantes en ISO 8601 UTC. Fechas de negocio (ciclo, despacho, ventana, feriados) como `YYYY-MM-DD` de Guayaquil.
- Identificadores públicos UUID. Número de pedido visible `JDS-####`. SKU estable y nunca reutilizado.
- API versionada: `/api/v1/...`.

**Producto**

```json
{
  "sku": "PRO-DOCTOR",
  "slug": "doctor",
  "type": "personalizable",
  "name": "Doctor",
  "category": { "slug": "profesiones-y-hobbies", "name": "Profesiones y Hobbies" },
  "subcategory": { "slug": "salud", "name": "Salud" },
  "available": true,
  "price": { "...": "ver Precio" },
  "size_text": "Base 14 × 7 cm",
  "material_text": "Impresa en 3D con PLA Plus",
  "includes": ["Plantita natural", "Dedicatoria personalizada", "Funda kraft"],
  "description_html": "<p>...</p>",
  "media": [
    { "type": "image", "role": "front", "alt": "...", "w": 1080, "h": 1350, "srcset": { "600": "...webp", "1080": "...webp" } },
    { "type": "video", "url": "...mp4", "poster": "...webp", "duration_s": 7 }
  ],
  "related_skus": ["PRO-DOCTORA"],
  "configurator_url": "/api/v1/products/doctor/configurator",
  "seo": { "title": "...", "description": "...", "canonical": "https://jardindesele.com/producto/doctor", "og_image": "...jpg" }
}
```

`type`: `personalizable` | `complemento`. Un complemento nunca se compra sin al menos una maceta.

**Categoría con subcategorías** (pantalla de categorías)

```json
{
  "slug": "profesiones-y-hobbies",
  "name": "Profesiones y Hobbies",
  "headline": "...",
  "intro_html": "<p>...</p>",
  "hero": { "type": "video", "url": "...mp4", "poster": "...webp" },
  "price_from_cents": 2500,
  "promise": { "...": "ver Promesa" },
  "subcategories": [
    { "slug": "salud", "name": "Salud", "url": "/profesiones-y-hobbies/salud" },
    { "slug": "administrativos", "name": "Administrativos", "url": "/profesiones-y-hobbies/administrativos" }
  ],
  "active_subcategory": "salud",
  "products": [{ "sku": "PRO-DOCTOR", "slug": "doctor", "name": "Doctor", "image": "...webp", "price": { "...": "ver Precio" }, "available": true }],
  "seo": { "title": "...", "description": "...", "canonical": "https://jardindesele.com/profesiones-y-hobbies/salud", "og_image": "...jpg" }
}
```

`hero` es opcional (`image` | `video`). Sin subcategoría activa, `products` trae todos los productos de la categoría.

**Campaña de temporada**

```json
{
  "slug": "san-valentin",
  "name": "San Valentín",
  "state": "upcoming",
  "season_year": 2027,
  "event_date": "2027-02-14",
  "order_deadline": { "date": "2027-02-09", "label": "Pide hasta el martes 9 para recibir antes del 14 de febrero" },
  "related_category": { "slug": "amor", "url": "/amor" },
  "products": [],
  "seo": { "title": "...", "description": "...", "canonical": "https://jardindesele.com/san-valentin", "og_image": "...jpg" }
}
```

`state`: `active` (en temporada: productos y fecha límite) | `upcoming` (fuera de temporada: "San Valentín {season\_year} llegará muy pronto", categoría y productos relacionados).

**Precio** (lo calcula Laravel; Angular solo lo muestra)

```json
{
  "currency": "USD",
  "base_cents": 2500,
  "final_cents": 2250,
  "discount_cents": 250,
  "discount_percent": 10,
  "badge": "10% OFF",
  "valid_until": "2026-11-30T05:00:00Z",
  "applied_rule_id": "promo_1a2b"
}
```

**Promesa de entrega** (ficha de producto)

```json
{
  "server_now": "2026-11-09T21:18:00Z",
  "cycle_date": "2026-11-09",
  "cutoff_at": "2026-11-10T01:00:00Z",
  "dispatch_date": "2026-11-11",
  "window": { "start": "2026-11-12", "end": "2026-11-13" },
  "label": "Recíbelo entre jueves 12 y viernes 13 de noviembre",
  "countdown_label": "Pídelo en las próximas 3 h 42 min",
  "promise_token": "firmado-por-laravel",
  "amazon_note": "Región Amazónica: considera 1 día adicional."
}
```

`promise_token` lleva firmados el ciclo y la hora de emisión. Angular lo guarda al tocar "Personalizar" y lo envía al crear el pedido para aplicar la gracia del Paso 9.

**Ventanas disponibles** (calendario "Programar para otra fecha")

```json
{
  "windows": [
    { "start": "2026-11-12", "end": "2026-11-13", "available": true },
    { "start": "2026-11-14", "end": "2026-11-16", "available": true },
    { "start": "2026-11-17", "end": "2026-11-18", "available": false }
  ]
}
```

**Cotización del carrito** (el carrito vive en el navegador; Angular envía los ítems y Laravel responde)

```json
{
  "items": [
    {
      "item_id": "uuid-local",
      "sku": "PRO-DOCTOR",
      "quantity": 1,
      "personalization": {
        "name_text": "Josué de Santis",
        "glasses": { "sku": "LEN-NEGRO" },
        "accessories": [
          { "slot": "lateral-derecho", "sku": "ACC-ESTETOSCOPIO" },
          { "slot": "frente", "sku": "ACC-MARCO-FRASE", "phrase_text": "Avanza en fe hacia tus propósitos. Dios te bendiga." }
        ],
        "dedication": { "mode": "text", "text": "Feliz cumpleaños 💚" }
      },
      "price": { "...": "ver Precio" },
      "line_total_cents": 2250
    }
  ],
  "totals": { "subtotal_cents": 2250, "discount_cents": 0, "shipping_cents": null, "card_fee_cents": null, "total_cents": 2250 },
  "incentives": {
    "planter_count": 1,
    "free_shipping_unlocked": false,
    "show_second_planter_offer": true,
    "show_complements": true,
    "checkout_allowed": true
  },
  "identical_planters": [],
  "promise": { "...": "ver Promesa" }
}
```

- `accessories` trae exactamente la cantidad elegible del producto (2 por defecto). Un marco con foto lleva `photo_upload_id`; uno con frase, `phrase_text`. El elemento fijo va en la foto base y no aparece aquí.
- `dedication.mode`: `text` | `none` ("No quiero dedicatoria"). El comprador debe elegir uno.
- `quantity` solo es editable en complementos; cada maceta es un ítem con su propia personalización.
- `planter_count` cuenta solo productos personalizables. `checkout_allowed` es `false` si no hay ninguna maceta.
- `identical_planters` lista los grupos de ítems con la misma personalización exacta, para la confirmación del Paso 11.
- `shipping_cents` es `null` hasta conocer la zona; `card_fee_cents`, hasta elegir tarjeta.

**Checkout (petición)**

```json
{
  "items": [{ "...": "ítems del carrito" }],
  "promise_token": "...",
  "shipping": { "name": "...", "id_type": "cedula", "id_number": "...", "phone": "+5939...", "email": "...", "province_code": "09", "canton_code": "0901", "locality_id": null, "address": "...", "reference": "..." },
  "billing": { "same_as_shipping": true },
  "contact": { "same_as_shipping": true },
  "payment_method": "card",
  "window_choice": { "type": "immediate" },
  "terms": { "accepted": true, "version": "2026-11" },
  "marketing_consent": { "email": false, "whatsapp": false },
  "tracking": { "...": "ver Tracking" }
}
```

`id_type`: `cedula` | `ruc` (sin pasaporte). `payment_method`: `card` | `transfer`. `window_choice.type`: `immediate` | `scheduled` (con `start`). `locality_id` es opcional.

**Tracking y atribución** (lo envía Angular; la IP la toma Laravel)

```json
{
  "ga_client_id": "...", "ga_session_id": "...",
  "fbp": "...", "fbc": "...", "fbclid": "...",
  "ttclid": "...", "ttp": "...",
  "utm": { "source": "meta", "medium": "paid", "campaign": "...", "content": "<ad_id>", "term": null },
  "landing_url": "...", "page_url": "...", "user_agent": "...",
  "first_touch": { "...": "utm + landing + fecha" },
  "last_touch": { "...": "utm + landing + fecha" },
  "cookie_consent": { "marketing": true }
}
```

**Pedido** (vista de seguimiento; solo pedidos pagados)

```json
{
  "order_number": "JDS-2048",
  "visible_status": "confirmado",
  "payment": { "method": "transfer", "status": "paid", "paid_at": "..." },
  "window": { "start": "2026-11-12", "end": "2026-11-13" },
  "shipment": { "carrier": "Servientrega", "tracking_number": null },
  "items": [{ "name": "Doctor", "name_text": "Josué de Santis" }],
  "total_cents": 2850
}
```

**Pedido pendiente de pago** (transferencia)

```json
{
  "order_number": "JDS-2049",
  "status": "pending_payment",
  "total_cents": 5000,
  "deadline_at": "2026-11-10T12:50:00Z",
  "deadline_label": "Paga antes del martes 10 de noviembre, 07:50",
  "window": { "start": "2026-11-12", "end": "2026-11-13" },
  "bank_accounts": [{ "bank": "...", "type": "...", "number": "...", "holder": "...", "id_number": "..." }],
  "receipt": { "uploaded": false },
  "whatsapp_url": "/api/v1/orders/JDS-2049/whatsapp"
}
```

**Error**

```json
{ "error": { "code": "capacity_full", "message": "...", "details": {} } }
```

Códigos mínimos: `capacity_full`, `window_unavailable`, `price_changed`, `zone_unavailable`, `planter_required`, `accessories_count_invalid`, `name_too_long`, `text_too_long`, `id_invalid`, `terms_required`, `upload_invalid`, `order_expired`.

**Glosario de estados**

| Dimensión | Valores |
| --- | --- |
| Pago | `unpaid`, `in_progress`, `pending_validation`, `paid`, `failed`, `refunded` |
| Operativo | `created`, `ready_for_production`, `in_production`, `shipped`, `cancelled`, `expired` |
| Canal | `web`, `whatsapp` |
| Facturación | `invoiced` (sí o no) |
| Visible al comprador | Pendiente de pago (solo transferencia) · Confirmado · En producción · Enviado · Cancelado · Reembolsado |

**Terminado cuando.** Cada pantalla del recorrido lee mocks con estas formas exactas y ningún componente calcula precios, recargo, envío, fechas ni disponibilidad.

**Pruebas.** Revisión cruzada: cada campo que muestra una pantalla existe en un contrato; ningún contrato tiene campos que Angular calcule.

**NO CAMBIAR.** Laravel calcula; Angular representa. Dinero en centavos. Fechas de negocio en Guayaquil.

## Paso 1 — Cierre del frontend funcional

**Objetivo.** Todas las pantallas del recorrido funcionan de punta a punta con los mocks del Paso 0 y con la lógica de negocio de este paso. Después se detiene la creación de pantallas nuevas y empieza el backend.

**Dependencias.** Paso 0.

**Orden de trabajo acordado**

1. 1A — Arreglos inmediatos (lista de abajo).
2. 1B — Correcciones de la revisión del 2 de noviembre (lista de abajo). Envío y facturación, pago y confirmación ya existen; se corrigen aquí.
3. Pedido pendiente por transferencia con subida de comprobante.
4. Seguimiento, solo para pedidos pagados.
5. Ficha de producto replicable y personalizador.
6. Página principal, pantalla de categorías (según el mockup de Josué), búsqueda y plantilla de temporada (San Valentín).

**1A — Arreglos inmediatos**

- [x] Proteger con `isPlatformBrowser` el código que usa APIs del navegador durante el SSR: `colecciones.ts`, `slider.ts` y `medirTodo()` de `carrito.ts`. *(Hecho en `colecciones.ts`, `slider.ts` y `medirTodo()` del carrito; el servidor renderiza sin errores.)*
- [x] Hacer compilar `ng test`: exportar las interfaces de dominio y reemplazar las pruebas de plantilla por pruebas reales mínimas.
- [x] Ocultar o crear los enlaces a rutas que no existen (`/checkout`, `/cuenta`, `/buscar`, `/favoritos`, `/productos` y los del pie). *(Hecho: se ocultaron buscar, cuenta, favoritos y los enlaces del pie que no tienen página; vuelven cuando existan.)*
- [x] 404 real, con página propia, para productos y rutas inexistentes. *(Hecho: el servidor responde con estado 404.)*
- [x] Quitar los restos de la plantilla anterior: libro de reclamaciones y logos de PayPal, Western Union, Amex y similares. Mostrar solo los medios reales: tarjeta vía PayPhone y transferencia. *(Hecho: el pie solo muestra tarjeta con PayPhone y transferencia.)*
- [x] Nombre de placa: pasar del canvas estirado a SVG (regla en "Implementación acordada"). *(Hecho: SVG incrustado con Lobster WOFF2 precargada, centrado, sin estirar, con tamaños 12,5 / 12 / 11. Color dorado sólido #C7B084, tomado de la foto de referencia de Josué; se cambia en `placa.ts` si entrega un HEX oficial.)*
- [x] Quitar de la ficha la fecha, la dedicatoria y la foto: van en el personalizador, y la fecha se reemplaza por el bloque de promesa. *(Hecho: la ficha muestra la promesa del mock.)*
- [x] Declarar la versión de Node (`engines` y `.nvmrc`) igual a la del servidor de Hostinger. *(Hecho: Node 22.x.)*
- [x] Quitar dependencias e imports sin uso (SweetAlert2 y el import de `Carrito` en `EnvioGratisService`).

**1B — Correcciones de la revisión del 2 de noviembre** (el código actual contradice el documento; se hace antes de seguir)

- [x] Quitar toda opción de enviar algo por WhatsApp después: "Prefiero enviar mi tarjeta de dedicatoria por WhatsApp", enviar la foto o la frase del marco por WhatsApp, el bloque "Pendiente por WhatsApp" de la confirmación y la frase "Te enviaré por aquí…" del mensaje. Todo se completa en la web antes de pagar.
- [x] Quitar la foto de la tarjeta de dedicatoria: la dedicatoria es solo texto, o "No quiero dedicatoria".
- [ ] Provincias, cantones y localidades desde el JSON del INEC dentro del proyecto (Paso 10). *(Hecho: provincias y cantones del INEC 2026 y sin countriesnow.space. Hecho también: La Aurora, La Joya, Villa Club y Villa Italia salen en la lista de cantones como "La Aurora - Daule" etc., desde `sectores-zona-a.json`, sin selector aparte. Falta: el panel que las edite.)* Eliminar el uso de countriesnow.space en `UbicacionesService`: no trae cantones como Durán y, si falla, nadie puede comprar.
- [ ] Zona y tarifa por localidad > cantón > provincia (Paso 10), no por nombre de ciudad. Amazonía $6,25. *(Hecho por cantón y provincia con códigos del INEC; Galápagos bloqueado; esos cuatro sectores de Daule son Zona A $3,50.)*
- [x] Lista de países del número de contacto fija dentro del proyecto (sin restcountries.com), con Ecuador (+593) primero. *(Decisión del 3 nov: solo se envía a Ecuador, así que se quita el selector y el número queda fijo en +593.)*
- [x] Una sola casilla obligatoria y desmarcada, "Acepto los términos y condiciones de Jardín de Sele", con enlace a `/terminos-y-condiciones` (Paso 12). Decisión de Josué (5 nov): no hay casilla de marketing. *(Hecho en `/checkout/pago`.)*
- [x] Resumen final con la personalización completa de cada maceta y el aviso "Revisa bien: después de confirmar no se puede editar".
- [x] Fecha de entrega desde la promesa del mock (Paso 0), no el texto fijo "jueves a viernes"; elección de ventana inmediata o programada en el checkout. *(Hecho en pago y confirmación con `PromesaService`, un mock con la forma exacta del Paso 0. Falta mostrarla en la ficha y la página principal.)*
- [x] Transferencia: después de confirmar, mostrar la hora límite de 12 horas y el botón "Subir comprobante" (pedido pendiente, Paso 14). El mensaje de WhatsApp es corto: "Hola 🌿 Te envío el comprobante de mi pedido JDS-2048." con el total y hasta 3 productos, sin datos personales ni dirección. *(El botón abre WhatsApp con el mensaje corto; la subida del comprobante en la web llega con el Paso 14.)*
- [x] "Usar otros datos de facturación": agregar los campos (nombre, cédula o RUC, correo y dirección).
- [x] Logos de tarjetas: mostrar solo las marcas que PayPhone acepte en la cuenta de Josué. *(Visa, Mastercard, Diners Club y Discover, confirmadas por Josué.)*
- [x] PayPhone simulado: hoy el pedido con tarjeta se marca pagado sin cobro. Debe quedar marcado como simulación y nunca llegar así a producción (Paso 13). *(Hecho: el pedido queda con `pagoSimulado` y se avisa en pago y confirmación.)*
- [x] Titular y cuentas bancarias de ejemplo: reemplazarlos por los datos reales que entregue Josué.

**Rutas definitivas** (con SSR; todas se pueden recargar y compartir)

| Ruta | Pantalla |
| --- | --- |
| `/` | Página principal |
| `/categorias` | Pantalla de categorías; reemplaza "Todos los productos" |
| `/profesiones-y-hobbies`, `/amor`, `/amistad`, `/familia` | Pantalla de categorías con esa categoría activa |
| `/profesiones-y-hobbies/salud`, `/profesiones-y-hobbies/administrativos`, `/profesiones-y-hobbies/fuerza-publica`, `/profesiones-y-hobbies/cocina-y-hobbies` | Misma pantalla con esa pestaña activa |
| `/producto/{slug}` | Ficha de producto |
| `/producto/{slug}/personalizar` | Personalizador (ruta hija) |
| `/carrito` | Carrito |
| `/checkout` | Paso 1 del checkout: envío y facturación |
| `/checkout/pago` | Paso 2: método de pago y resumen final |
| `/checkout/confirmacion` | Paso 3: agradecimiento sin token (tarjeta pagada o pedido por transferencia creado) |
| `/pedido/{token}` | Pedido pendiente de pago o seguimiento, según el estado |
| `/consultar-pedido` | Reenvío del enlace privado al correo |
| `/san-valentin` | Campaña de temporada (y las que se creen después) |
| Políticas y 404 propio | — |

Redirecciones 301 *(hechas como redirección de Angular, 302; el 301 real llega con el servidor)*: `/catalogo/todos-productos` → `/categorias`; `/catalogo/todos-productos/:producto` → `/producto/{slug}`; `/catalogo/:slug` → su categoría; `/catalogo` → `/`.

**Página principal** (de arriba hacia abajo en el celular)

- [x] Barra superior: logo, lupa, carrito y menú. *(Hecho en la barra existente, con la lupa hacia `/buscar`.)*
- [ ] Video principal (la esposa de Josué mostrando las macetas) con el botón "Encuentra tu detalle perfecto", que abre `/categorias`. *(Parcial: botón y espacio listos, con la portada como imagen; falta el video de Josué (`VIDEO.url` en `inicio.ts`).)*
- [x] Franja de promesa: "Pide hoy y recíbelo entre … y …" (desde la promesa vigente) y "Envío gratis llevando 2 macetas". *(Hecho con el mock de `PromesaService` y el número de macetas de `EnvioGratisService`.)*
- [ ] Campaña activa (por ejemplo, San Valentín), solo en temporada.
- [x] Las 4 categorías en tarjetas con foto. *(Hecho.)*
- [x] Favoritos: 6–8 productos elegidos y ordenados por Josué en el panel. *(Hecho con 6 favoritos de prueba; con backend los ordena Josué.)*
- [x] "Cómo funciona" en 3 pasos: elige, personaliza y recíbelo con su plantita. *(Hecho.)*
- [ ] Testimonios elegidos por Josué (Paso 24).
- [x] Confianza: pago seguro con tarjeta o transferencia, envíos a todo Ecuador por Servientrega (excepto Galápagos), hecho en Guayaquil. *(Hecho.)*
- [x] Pie: WhatsApp, "Consultar mi pedido", términos y redes. *(Hecho: WhatsApp, redes, "Consultar mi pedido" y los términos y condiciones.)*

**Pantalla de categorías**

- [x] Una sola plantilla, según el mockup de Josué: arriba las 4 categorías (Profesiones y Hobbies, Amor, Amistad, Familia); debajo, las pestañas de subcategorías de la categoría activa; abajo, la grilla de productos. *(Hecho con datos de prueba (`CategoriaService`, mock del contrato). El mockup de Josué todavía no está en el repositorio: el diseño es provisional hasta recibirlo.)* *(Actualización del 4 nov: `/categorias` pasó a ser la puerta de entrada (banner, 4 tarjetas con "Ver categoría", "¿Cómo funciona?" y confianza) y cada categoría tiene su propia página con banner, pestañas con ícono, texto de la pestaña, "Personalizar" en cada tarjeta y "Explora otras categorías", según las imágenes de Josué. La pestaña "Todos" se conserva para ver toda la categoría. Sin el corazón de favoritos.)*
- [x] Cada estado tiene su URL. Cambiar de categoría o de pestaña actualiza la URL sin recargar; entrar directo a cualquiera de esas URL (por ejemplo, desde un anuncio) abre la pantalla en ese estado. *(Hecho: `/categorias`, `/{categoria}` y `/{categoria}/{subcategoria}`; una subcategoría inexistente da 404. Falta conservar el scroll al volver desde un producto.)*
- [x] Encabezado por categoría: título, texto, video horizontal o imagen opcional, promesa de entrega vigente y precio "desde". *(Hecho con imagen opcional; el video llega con los medios reales.)*
- [x] Grilla: foto, nombre, precio con descuento y badge; sin video en las tarjetas; todos los productos de la pestaña activa, sin "Ver más" ni virtualización, con imágenes diferidas. *(Hecho con imágenes diferidas y todos los productos de la pestaña.)* *(El mockup agrega "Ver más de {pestaña}": se ven los primeros 4 y el resto se abre con el botón (todos están en el HTML).)*
- [x] Cada categoría y subcategoría tiene su propio título, descripción e imagen para compartir; funciona con UTMs y carga rápido en el celular. *(Hecho: título, descripción, imagen para compartir y canonical por estado; la imagen social definitiva la entrega Josué.)*
- [x] Subcategorías iniciales de Profesiones y Hobbies: Salud, Administrativos, Fuerza Pública, Cocina y Hobbies. Las de Amor, Amistad y Familia las define Josué; mientras no existan, la categoría se muestra sin pestañas. *(Hecho; Amor, Amistad y Familia salen sin pestañas.)*

**Búsqueda**

- [x] Lupa en la barra superior de todas las páginas. Búsqueda instantánea sobre un índice pequeño (nombre, sinónimos, categoría y subcategoría), sin tildes ni mayúsculas, con coincidencia por inicio de palabra ("fisio" encuentra Fisioterapeuta; "medico" encuentra Médico). *(Hecho en `/buscar?q=`, con la lupa en la barra del escritorio y del celular; índice y sinónimos de prueba en `CategoriaService`, que con backend salen del panel.)*
- [x] Sin resultados: productos sugeridos (los favoritos) y debajo "¿No encuentras lo que necesitas?" con dos botones: "Explora nuestras categorías" (`/categorias`) y "Escríbenos por WhatsApp" (prellenado con lo buscado). *(Hecho: favoritos de prueba, "Explora nuestras categorías" y WhatsApp con lo buscado.)*
- [ ] Cada búsqueda se registra con su término y cantidad de resultados (Paso 20); el panel lista las búsquedas sin resultados de los últimos 30 días (Paso 19).

**Ficha de producto** (plantilla de todos los productos; no necesita caber en una sola pantalla)

- [ ] Orden: galería → título → precio (anterior tachado, final destacado, badge) → qué incluye (plantita natural, dedicatoria personalizada, funda kraft) → tamaño → "Impresa en 3D con PLA Plus" → línea de envío → bloque de promesa → "O prográmalo para una fecha futura" → botón "Personalizar esta maceta" → descripción, testimonios y relacionados. *(Parcial: Hecho el orden hasta el botón; faltan testimonios y relacionados.)*
- [ ] Galería: imagen principal grande y miniaturas debajo; al tocar una miniatura se muestra arriba. 3–4 fotos + 1 video de 6–8 s (frontal → video → 3/4 → detalle → escala). El video, silenciado, `playsinline` y en bucle, se descarga y reproduce solo cuando su lámina está activa. *(Parcial: Hecho con miniaturas; faltan fotos extra y el video.)*
- [x] Línea de envío bajo el precio y en el carrito: "Envío desde $3,50 según destino · Lleva 2 macetas y el envío es gratis (excepto Galápagos)". Valores desde la configuración. *(Hecho en la ficha; falta en el carrito.)*
- [x] Bloque de promesa compacto: "Envío por Servientrega", "Recíbelo entre …", contador y la nota discreta de Amazonía. *(Hecho con el mock de `PromesaService`.)*
- [x] Calendario de ventanas: dibuja solo lo que llega en `windows`; tocar un día resalta su ventana completa (por ejemplo, sábado + lunes); los días no disponibles aparecen deshabilitados. *(Hecho: calendario mensual compartido por la ficha y el pago (`app-calendario-ventanas`). Tocar un día elige su ventana de 2 días válidos, sin domingos (sábado + lunes); los días sin ventana o no disponibles salen deshabilitados. La elección pasa al checkout.)*
- [x] Barra inferior fija con precio y "Personalizar". *(Hecho.)*
- [ ] Sin afirmaciones ecológicas que no estén verificadas.

**Personalizador** (`/producto/{slug}/personalizar`)

- [ ] Foto base del modelo con su elemento fijo ya integrado; el slot izquierdo queda reservado para ese elemento.
- [ ] Pestañas en hoja inferior: Hobbies, Amor, Mascotas y Marcos. Lentes y gafas aparte, con una imagen real por color.
- [x] **Accesorios:** el comprador elige **exactamente 2** (contador "1 de 2", "2 de 2"). Cuentan hobbies, amor, mascotas, marco con foto y marco con frase. No cuentan el elemento fijo, el nombre, las gafas o lentes ni la dedicatoria. Con 2 elegidos, para agregar otro debe quitar uno; con menos de 2 no puede continuar. *(Hecho: contador "n de 2" y exactamente 2.)*
- [x] **Marco con foto:** sube la foto en ese momento; aviso si es muy pequeña para imprimirse bien. *(Hecho; el aviso salta con el lado menor bajo 600 px, valor provisional en `minPxFoto` hasta que el negocio defina el mínimo.)*
- [x] **Marco con frase:** campo con el ejemplo "Avanza en fe hacia tus propósitos. Dios te bendiga." y contador "0/60". *(Hecho; el contador cuenta emojis como 1.)*
- [x] **Dedicatoria:** texto de hasta 250 caracteres con contador (emojis, tildes y ñ) **u** opción visible "No quiero dedicatoria". Debe elegir una de las dos para continuar. *(Hecho; el contador cuenta emojis como 1.)*
- [ ] Nombre en placa según la regla de abajo.
- [x] Borrador automático: la personalización se guarda en el navegador antes de agregarla al carrito y se ofrece "Continuar personalización" al volver. *(Hecho en `localStorage` por producto; la foto del marco no se guarda y hay que subirla otra vez.)*
- [ ] Al guardar, la maceta entra al carrito como un ítem nuevo.

**Carrito**

- [ ] Ítems con resumen de personalización, editar (vuelve al personalizador), eliminar, cantidad solo en complementos, complementos y "Ver más" en modal sin salir del carrito.
- [ ] **Regla de la segunda maceta:** con 1 maceta se ofrece "Agrega otra maceta y obtén envío gratis" y, debajo, los complementos. Con 2 o más macetas esa oferta desaparece, se muestra "¡Excelente! Ya tienes envío gratis" y se siguen ofreciendo complementos. Si vuelve a 1 maceta, la oferta reaparece. Solo cuentan macetas. Angular muestra u oculta según `incentives`; no lo calcula. *(Parcial: la oferta y "¡Excelente!" ya funcionan con el mock de `EnvioGratisService`; falta leer `incentives` de Laravel.)*
- [ ] **Segunda maceta desde el carrito:** abre la elección de producto y el personalizador; al guardar, vuelve al carrito actualizado.
- [ ] **Una maceta no se duplica con "+":** cada maceta se agrega desde el personalizador con su propia personalización.
- [x] **Macetas idénticas:** si el comprador agrega una maceta con exactamente la misma personalización que otra del carrito (mismo modelo, nombre, gafas, accesorios, frase o foto y dedicatoria), se le pregunta "Tienes dos macetas exactamente iguales. ¿Es correcto?". "Sí" las conserva; "Revisar" lo lleva a editar la nueva. Ambas cuentan para el envío gratis. *(Hecho en Angular con la huella de la personalización; "Sí" guarda `igualConfirmada` en el ítem.)*
- [x] **Complementos sin maceta:** un complemento nunca se compra solo. Si el carrito queda sin macetas, los complementos se conservan, se ocultan las sugerencias y se bloquea el checkout con "Los complementos acompañan a una maceta. Agrega una maceta para continuar." *(Hecho: se oculta la oferta de macetas y complementos, y "Continuar" queda bloqueado.)*

**Checkout** (tres pantallas con indicador de avance: `/checkout` envío y facturación → `/checkout/pago` → `/checkout/confirmacion`)

- [ ] Envío: nombre, tipo de identificación (cédula o RUC) y número, celular, correo, provincia, cantón, localidad (opcional), dirección y referencia opcional.
- [ ] Provincia, cantón y localidad: campos escribibles con buscador sobre listas controladas; nunca texto libre. Galápagos muestra "Actualmente no realizamos envíos a Galápagos."
- [ ] Facturación igual al envío por defecto u "otros datos" (cédula o RUC); contacto igual al celular de envío por defecto u "otro número".
- [ ] Ventana: inmediata o la programada.
- [ ] Método de pago: tarjeta o transferencia. Al elegir tarjeta aparece, antes de pagar, la línea "Recargo por pago con tarjeta (6%)" con su valor.
- [ ] Resumen final de cada maceta (modelo, nombre, gafas, los 2 accesorios, frase o foto y dedicatoria) con el aviso "Revisa bien: después de confirmar no se puede editar".
- [x] Casilla obligatoria y desmarcada "Acepto los términos y condiciones de Jardín de Sele" (con enlace). Sin casilla de marketing.
- [ ] Pago: espacio para la Cajita de PayPhone (simulada) y opción de transferencia.

**Después de pagar**

- [ ] `/checkout/confirmacion`, sin token: variante tarjeta pagada y variante transferencia (pedido creado, con las mismas instrucciones del pedido pendiente).
- [x] **Pedido pendiente** en `/pedido/{token}`: número, total, cuentas bancarias con botón copiar por dato, hora límite exacta ("Paga antes del martes 10, 07:50 para mantener tu fecha"), botón "Subir comprobante", botón de WhatsApp y aviso de que el pedido no se puede editar. Sin seguimiento. *(Hecho en Angular con un mock del contrato del Paso 0 (`PedidoPendienteService`): token largo, plazo en hora de Guayaquil, cuentas con copiar, subir comprobante simulado (JPG, PNG o PDF), WhatsApp, vencido y 404 si el token no coincide. Falta con backend: subida real, límite de intentos y límite de tamaño del archivo (no definido).)*
- [x] **Seguimiento** en `/pedido/{token}` cuando el pedido está pagado, con los estados visibles del Paso 0. *(Hecho en Angular con un mock del contrato "Pedido" (`SeguimientoService`): número, estado visible, ventana, productos con nombre, total y guía de Servientrega; la ruta elige entre seguimiento, pedido pendiente y 404, y lleva `noindex`. Hoy el estado es siempre "Confirmado"; En producción y Enviado los marca el panel. Falta con backend: `Cache-Control: private, no-store` y "Consultar mi pedido".)*
- [x] Ayuda en pedido pendiente y seguimiento: "¿Tienes alguna duda o novedad con tu pedido? Escríbenos por WhatsApp.", con el mensaje prellenado "Hola 🌿 Te escribo por mi pedido JDS-2048. Tengo la siguiente consulta:". *(Hecha en el pedido pendiente y en el seguimiento.)*

**Plantilla de temporada** (la usa `/san-valentin`; las demás se crean desde el panel)

- [x] En temporada: productos elegidos por Josué en su orden, imagen o video, texto, promoción opcional y el mensaje de fecha límite del Paso 9. (mock con datos de prueba; imagen o video y promoción llegan con el panel)
- [x] Fuera de temporada: la URL sigue respondiendo (200, sin redirección) con "San Valentín {año} llegará muy pronto", botón a su categoría relacionada (Amor) y productos relacionados. No aparece en la página principal ni en el menú. El año lo entrega Laravel (Paso 5). (mock `CampanaService`, estado `upcoming` probado)

**WhatsApp en la web**

- [ ] WhatsApp aparece en el pie de página, en la búsqueda sin resultados, en el pedido pendiente y en el seguimiento. **No hay botón flotante** en todas las páginas: la meta es que la compra se cierre en la web.

**Tracking en el frontend**

- [x] Captura de atribución al aterrizar: UTMs, `fbclid`, `ttclid`, landing y fecha en almacenamiento propio (primer y último toque). *(Hecho: `AtribucionService`; `fbp`, `fbc`, `ttp` y los ids de GA4 llegan con GTM en el Paso 20.)*
- [x] `dataLayer`: una función `track()` en cada paso del recorrido con los nombres del plan de eventos (Paso 20). *(Hecho: `AnalyticsService.track()` envía `page_view` (menos `/pedido/{token}`), `view_item`, `start_customization`, `add_to_cart`, `view_cart`, `open_more_products`, `begin_checkout`, `add_shipping_info`, `add_payment_info`, `select_delivery_window`, `select_subcategory`, `search`, `select_item` y `whatsapp_click`. Hoy solo llegan al `dataLayer`; GTM se carga en el Paso 20.)*

**Limpieza, navegación y video**

- [ ] Limpiar la plantilla: formato de precio en dólares ("$25"), quitar precios tachados falsos, "distrito", "ecosexual", "Atención 24/7", grillas duplicadas, el Gmail personal del pie, el contador de "vendidos" si no sale de pedidos reales, textos internos en descripciones y los enlaces a cuenta, favoritos y recuperar contraseña. *(Parcial: en las páginas activas ya no hay precios tachados falsos, descuento calculado en Angular ni textos internos en las descripciones (reescritos para el cliente; Josué debe aprobarlos). Quedan solo en las páginas viejas que se conservan sin ruta. Pendiente: confirmar con Josué las descripciones definitivas y el Gmail del pie, que es el crédito del desarrollador.)*
- [ ] Navegación con contexto: el producto es una página real. Al volver, la pantalla de categorías conserva categoría, pestaña, productos y posición de scroll (`RouteReuseStrategy` + `ViewportScroller` cuando termina de dibujarse). Una sola capa activa, sin modales apilados.
- [ ] "Cerrar" vuelve atrás solo si hubo navegación previa dentro del sitio; si se entró directo (por ejemplo, desde un anuncio), lleva a la categoría del producto.
- [ ] Video en página principal, categorías y ficha (perfiles del Paso 6): H.264 sin audio, portada como imagen inicial, un solo video reproduciéndose, pausa fuera de pantalla, con la pestaña oculta y al abrir un producto. Con "reducir movimiento", solo la portada.

**Implementación acordada**

- **Nombre en placa:** máximo 30 caracteres contando espacios, sin emojis. Nunca se bloquea un nombre de 30 o menos por una estimación de ancho del navegador.
- **Vista previa del nombre:** SVG incrustado en la página (no `<img>` ni fondo CSS), Lobster en WOFF2 precargada, medida solo después de `document.fonts.load()`, centrada con `text-anchor="middle"` y línea base fija.
- **Tamaño del texto:** en producción el nombre va entre 11 y 12,5 (referencia 12) en el software de impresión. La vista previa lo representa igual: los nombres cortos llegan hasta el equivalente de 12,5; los medianos usan 12; los largos bajan hasta 11. Si un nombre válido no cabe a 11, solo se reduce la representación en pantalla. Nunca se estira horizontalmente ni se rasteriza. Esos valores no se convierten literalmente a milímetros del SVG.
- **Texto dorado:** color sólido igual al HEX oficial que entrega Josué; degradado de dos tonos solo si es trivial dentro del mismo SVG.
- **Contadores de texto:** la dedicatoria y la frase cuentan los caracteres como los ve el comprador (cada emoji = 1). Angular y Laravel cuentan igual.
- **Angular no calcula** precios, descuentos, recargo, envío, totales, ventanas ni disponibilidad.
- **Pixeles y GTM** nunca se cargan en `/pedido/{token}`.

**Datos y configuración.** Mocks del Paso 0. HEX dorado. Fuente Lobster WOFF2. Mockup de la pantalla de categorías.

**Acción de Josué**

- Entregar el HEX oficial del dorado (pieza real con luz neutra, tonos medios muestreados, validado en 2–3 celulares).
- Entregar el mockup de la pantalla de categorías y el video principal.
- Elegir los 6–8 productos favoritos.
- Validar en el celular el recorrido completo con mocks y aprobar la estructura.

**Terminado cuando**

- Todas las pantallas funcionan con mocks en celular y escritorio, incluidas la página principal y la de categorías.
- Recargar cualquier ruta muestra esa página, nunca la portada ni "Cannot GET".
- Un nombre corto se ve más grande que uno largo sin pasar el equivalente de 12,5, y uno de 30 caracteres cabe sin desbordar.
- Las reglas del carrito y del personalizador se comportan como se describe.

**Pruebas**

- Recargar cada ruta; abrir un enlace de producto y de subcategoría compartido por WhatsApp.
- Nombres: "Josué", "Dra. Ana López", "Ingeniero Josué de Santis A." y "María José Rodríguez Zambrano".
- Carrito: 1 maceta (oferta visible y complementos), 2 macetas (oferta oculta, "Ya tienes envío gratis", complementos visibles), volver a 1 (la oferta reaparece), dos macetas idénticas (confirmación), solo complementos (checkout bloqueado).
- Personalizador: continuar con 1 accesorio (bloqueado), elegir un tercero (pide quitar uno), dedicatoria vacía sin "No quiero dedicatoria" (bloqueado), frase de 61 caracteres (bloqueada), dedicatoria con emojis y tildes.
- Búsqueda: "medico", "fisio" y un término sin resultados. Galápagos bloqueado.

**NO CAMBIAR.** Guest checkout sin login. Sin login social. Sin retiro en taller. Upsells dentro del carrito, sin pantalla extra. Dedicatoria solo texto. Todo se completa antes de pagar. Exactamente 2 accesorios elegibles por defecto. Selector con slots + overrides. Límite de 30 caracteres. Sin botón flotante de WhatsApp. Pantallas aprobadas como referencia funcional.

## Paso 2 — Propiedad, cuentas y accesos

**Objetivo.** Todos los activos del negocio quedan a nombre de Jardín de Sele/Josué, y el desarrollador trabaja con accesos limitados y revocables.

**Dependencias.** Ninguna. Puede avanzar en paralelo con el Paso 1. Lo que haga falta para staging debe estar listo antes del Paso 3.

**Tareas**

**Prioritario: repositorio a nombre del negocio** (fecha coordinada con Josué)

1. Josué crea la cuenta de GitHub del negocio con su correo y su contraseña, y activa la verificación en dos pasos.
2. El desarrollador transfiere el repositorio `E-commerce` desde Settings → Transfer ownership a esa cuenta.
3. Josué acepta el correo de confirmación (vence en un día).
4. GitHub conserva historial, issues y pull requests, redirige la URL antigua y deja al desarrollador como colaborador automáticamente. Si el despliegue de Hostinger está conectado a la cuenta anterior, se reconecta.

Terminado cuando: el repositorio aparece en la cuenta del negocio y el desarrollador sigue subiendo cambios con normalidad.

- [ ] Crear o confirmar cada cuenta de la tabla a nombre del negocio.
- [ ] Dar al desarrollador el acceso indicado (invitación o rol), nunca la contraseña de Josué.
- [ ] Entregar IDs y tokens por un gestor de contraseñas compartido; nunca por chat ni WhatsApp.
- [ ] Registrar en `docs/accesos.md` qué acceso tiene cada persona (sin secretos) y cómo revocarlo.

**Implementación acordada**

| Plataforma | Qué crea o tiene Josué | Qué entrega al desarrollador | Cómo da acceso |
| --- | --- | --- | --- |
| GitHub | Repositorio a su nombre | — | Invitación como colaborador |
| Hostinger | Plan Unlimited y dominio | — | Acceso compartido de hPanel |
| Cloudflare | Zona de jardindesele.com | — | Miembro con rol limitado (no superadministrador) |
| Meta | Business Manager, dominio verificado, dataset (Pixel), catálogo | Pixel ID; token de Conversions API | Acceso parcial al dataset y al catálogo |
| TikTok | Business Center, Pixel, catálogo si se usa | Pixel ID; token de Events API | Miembro con acceso al pixel |
| Google | Cuenta de la empresa (no personal), GA4, GTM, Search Console (Merchant Center, después del lanzamiento) | Measurement ID; API secret de Measurement Protocol | Usuario en cada herramienta; publicar en GTM |
| Bing | Webmaster Tools importado desde Search Console | — | — |
| PayPhone | Payphone Business; app de Pruebas y app de Producción | StoreID y Token de cada app | Usuario con rol Desarrollador |
| Correo | Buzones `pedidos@`, `hola@`, `sistema@`, `alertas@` | Contraseña solo de `pedidos@` y `sistema@` (para SMTP) | — |
| Monitoreo | Cuenta de errores y de aviso de caídas a su correo | — | Invitación |
| Banco | Cuentas para transferencia | Texto exacto a mostrar | — |
| WhatsApp | Número oficial | Número en formato +593 | — |

- El token de Conversions API se genera en Events Manager → Configuración → Generar token de acceso. Solo lo ve alguien con privilegios de desarrollador del negocio: lo genera Josué o le da ese rol al desarrollador.
- El API secret de Measurement Protocol se crea en GA4 → Administrar → Flujos de datos → Secretos de API de Measurement Protocol.

**Datos y configuración.** Valores para los `.env` de staging y producción (Paso 3). Nada de esto va en Angular, salvo los IDs públicos (Pixel ID, Measurement ID, contenedor GTM) y lo que exija la Cajita (Paso 13).

**Acción de Josué.** Toda la columna "Qué crea o tiene Josué" de la tabla, y entregar los IDs y tokens de la columna siguiente.

**Terminado cuando.** El desarrollador puede trabajar en todas las plataformas sin conocer ninguna contraseña de Josué, y existe `docs/accesos.md`.

**Pruebas.** Josué revoca y vuelve a dar un acceso de prueba (por ejemplo, el miembro de Cloudflare) para confirmar que sabe hacerlo.

**NO CAMBIAR.** Las cuentas son propiedad de Jardín de Sele. No se comparten contraseñas personales cuando existe invitación, rol, token o acceso limitado.

## Paso 3 — Repositorio, entornos, staging y despliegue

**Objetivo.** Existe un staging aislado igual a producción y un flujo de despliegue repetible, para que cada paso siguiente se pruebe allí antes de llegar a clientes reales.

**Dependencias.** Paso 2 (repositorio, Hostinger, Cloudflare y cuentas de prueba).

**Tareas**

- [ ] Ramas: `main` (producción), `staging`, y ramas de trabajo con pull request.
- [ ] Crear `staging.jardindesele.com` con su propia app Node (SSR), su propio Laravel y su propia base de datos.
- [ ] Un `.env` por entorno; ningún secreto en el repositorio ni en Angular.
- [ ] Proteger staging con contraseña HTTP o Cloudflare Access, dejando libre solo la ruta del webhook de PayPhone.
- [ ] Cabecera `X-Robots-Tag: noindex` en staging siempre, y en producción hasta el día del lanzamiento.
- [ ] Pruebas automáticas en cada pull request (GitHub Actions): `php artisan test` y build de Angular.
- [ ] Script de despliegue documentado en `docs/deploy.md`.

* [ ] Hosts permitidos del SSR (`allowedHosts` en `src/server.ts`) leídos de una variable de entorno, para agregar staging sin tocar código.

**Implementación acordada**

- **Staging en subdominio:** la herramienta de staging de Hostinger está documentada solo para WordPress. El plan Unlimited admite hasta 5 sitios Node.js y 150 bases de datos, así que alcanza.
- **Staging nunca toca datos ni plataformas reales:**
  - base de datos solo con datos ficticios (seeders);
  - PayPhone con la app de **Pruebas** registrada con el dominio de staging;
  - correos con `MAIL_MAILER=log` o solo a una lista interna;
  - GA4 en una propiedad separada;
  - Meta y TikTok con un pixel de prueba o solo `test_event_code` en servidor; nunca el pixel de producción.
- **Flujo de despliegue:**
  1. Rama de trabajo → pull request → pruebas automáticas.
  2. Merge a `staging` → despliegue: `git pull`, `composer install --no-dev`, `php artisan migrate --force`, cachés de configuración y rutas, build de Angular, reinicio de la app Node.
  3. QA en staging.
  4. Merge a `main` → backup de la base → el mismo commit pasa a producción → prueba rápida (home, producto, checkout hasta el pago, panel).
  5. Una etiqueta por versión. Volver atrás = desplegar la etiqueta anterior.
- Las migraciones deben ser compatibles con la versión anterior o tener `down()` probado.

**Datos y configuración.** Variables por entorno: `APP_ENV`, `APP_URL`, `APP_KEY`, base de datos, correo, PayPhone (StoreID, Token), GA4 (Measurement ID, API secret), Meta (Pixel ID, token CAPI, `test_event_code`), TikTok (Pixel ID, token), contenedor GTM.

**Acción de Josué**

- Confirmar en hPanel: acceso SSH, ruta de PHP para cron, y que se puede crear la segunda app Node y la segunda base.
- En PayPhone, crear la app de Pruebas con el dominio y la URL de respuesta de staging (confirmar con PayPhone que acepta el subdominio).
- Crear la propiedad GA4 de prueba y el pixel de prueba.

**Terminado cuando**

- Un cambio llega a staging y luego a producción solo con el flujo documentado.
- Staging pide contraseña, no se indexa y no envía nada a plataformas reales.

**Pruebas.** Desplegar una versión, volver a la anterior por etiqueta y confirmar que todo sigue funcionando. Hacer un pedido en staging y verificar que no aparece en GA4, Meta ni TikTok de producción.

**NO CAMBIAR.** Mismo repositorio Git para todo. Staging separado en app, base, `.env`, PayPhone, analítica, tracking y correos. Sin DevOps empresarial.

## Paso 4 — Base técnica del backend

**Objetivo.** El backend tiene resueltas desde el inicio las piezas transversales: caracteres, hora, seguridad, IP real, cola, scheduler, configuración del negocio y vigilancia.

**Dependencias.** Paso 3.

**Tareas**

- [ ] **Crear el proyecto Laravel** (hoy no existe) con MariaDB, dentro del repositorio del negocio, con la estructura de carpetas que defina el desarrollador.
- [ ] Verificar en hPanel la versión de PHP del plan y usar una versión con el parche de PHP2Shell (8.4.27 o superior, u 8.5.12 o superior). Revisar actualizaciones cada mes.

* [ ] Base de datos, tablas y columnas en `utf8mb4` / `utf8mb4_unicode_ci`. Convertir las tablas existentes antes de cargar datos reales.
* [ ] `APP_TIMEZONE=UTC` y conexión a la base en `+00:00`.
* [ ] Un único servicio `BusinessCalendar` para todo cálculo de fechas de negocio, con la zona `America/Guayaquil` por nombre.
* [ ] Solo la carpeta `public` de Laravel es accesible desde la web.
* [ ] Laravel confía en el proxy de Cloudflare y lee la IP real de `CF-Connecting-IP`.
* [ ] Autenticación del panel: un solo rol Administrador, doble factor con opción de recordar el dispositivo, y botón para cerrar todas las sesiones. *(Hecho: ingreso único `/ingresar` con token Bearer, guarda de rutas por rol, "Cerrar sesión" y "Cerrar todas las sesiones". Falta el doble factor.)*
* [ ] CSRF en todo el panel y en las acciones del cliente; todas las acciones por POST, nunca por GET.
* [ ] Límites de intentos: login, subida de comprobantes, "Consultar mi pedido" y subida de fotos.
* [ ] Cola con driver `database`, tablas `jobs` y `failed_jobs`.
* [ ] Cron de Hostinger cada minuto: `php /ruta/artisan schedule:run`.
* [ ] Endpoint de salud que informa la última ejecución del scheduler y de la cola.
* [ ] Rastreo de errores y logs con rotación.
* [ ] Tabla `settings` editable desde el panel con todos los parámetros iniciales del negocio.

**Implementación acordada**

- **Fechas:** instantes en UTC; fechas de negocio como `DATE` de Guayaquil; nunca se usa la hora del navegador. Meta, TikTok y GA4 reciben tiempo Unix.
- **Cola:** sin Supervisor (las apps Node de Hostinger corren bajo demanda y no hay procesos persistentes documentados). El scheduler ejecuta cada minuto `queue:work --stop-when-empty --max-time=50 --tries=3 --timeout=30` con `withoutOverlapping()`.
- **Reintentos:** 3 intentos con espera de 1, 5 y 15 minutos. Llamadas HTTP externas con timeout de 10 s. `retry_after` de la cola en 90 s, siempre mayor que el timeout del trabajo.
- **Va a la cola:** correos, eventos de servidor (Meta, TikTok, GA4), feed, avisos, procesamiento secundario de imágenes.
- **No va a la cola:** precio, envío, descuentos, reserva de capacidad, recargo por tarjeta, creación del pedido, Confirm de PayPhone, cambio a "pagado" y guardado de la foto original subida.
- **Fallos:** cada trabajo fallido queda en `failed_jobs` y genera un aviso a `alertas@`.
- **Emojis:** permitidos en dedicatoria, frases y mensajes. El nombre en placa conserva su propia validación (sin emojis).

**Datos y configuración.** `config/database.php` (charset y collation), `config/app.php` (timezone), `TrustProxies` con los rangos de Cloudflare, `settings`.

**Acción de Josué.** Confirmar en hPanel la ruta de PHP que acepta el cron y que `php artisan` corre desde ahí. Crear la cuenta del monitor de caídas y del rastreo de errores a su correo.

**Terminado cuando**

- Abrir `/.env` y cualquier ruta de `storage` en el dominio del backend devuelve 403 o 404.
- Los logs muestran la IP real del visitante, no una de Cloudflare.
- Un trabajo de prueba encolado se ejecuta en menos de 1 minuto.
- El monitor externo alerta si el scheduler pasa más de 5 minutos sin correr.

**Pruebas**

- Guardar y leer un texto con emojis y "ñ".
- Detener el cron 6 minutos y confirmar que llega la alerta.
- Forzar un trabajo fallido y confirmar el aviso.
- Login con doble factor desde el celular.

**NO CAMBIAR.** Hostinger Unlimited. Cola `database`. Sin Redis ni Horizon. Sin microservicios. Un solo rol Administrador por ahora. Backend en Laravel (PHP) sobre Hostinger, con PHP siempre parcheado.

## Paso 5 — Catálogo y panel de productos

**Objetivo.** Josué administra categorías, subcategorías, productos, accesorios, complementos, favoritos y campañas sin depender del desarrollador, y la web pública lee el catálogo real en SSR.

**Dependencias.** Pasos 0, 1 y 4.

**Tareas**

- [ ] **Panel de administración** en Angular (consume la API de Laravel; Filament descartado), cómodo en el celular para las acciones frecuentes.
- [ ] **Categorías:** nombre, slug, descripción, orden, imagen o video de encabezado, imagen social, SEO, activa o inactiva. Admiten categorías nuevas sin cambiar código. Iniciales: Profesiones y Hobbies, Amor, Amistad y Familia.
- [ ] **Subcategorías:** nombre, slug, orden y categoría. Iniciales de Profesiones y Hobbies: Salud, Administrativos, Fuerza Pública, Cocina y Hobbies.
- [ ] **Productos:** tipo (`personalizable` o `complemento`), SKU, slug, nombre, categoría, subcategoría, precio base, costo interno, tamaño, "qué incluye", descripción, disponibilidad, activo o inactivo, relacionados, sinónimos de búsqueda, SEO e imagen social.
- [ ] **Accesorios y opciones:** SKU, pestaña (Hobbies, Amor, Mascotas, Marcos, Lentes/gafas), variante de color real, precio extra (0 por defecto), costo, disponibilidad (agotado) y productos compatibles.
- [ ] **Configurador por producto:** foto base con el elemento fijo integrado, slots (posición, tamaño, rotación, espejo) y overrides por accesorio o slot, editables con formulario y vista previa; cantidad de accesorios elegibles (2 por defecto).
- [ ] Botón **"Duplicar producto"**, que copia ficha, medios y configurador para crear un modelo nuevo en minutos.
- [ ] **Complementos:** productos tipo `complemento` con cantidad editable y, si los necesitan, campos de personalización: etiqueta, tipo (texto u opción), obligatorio, largo máximo, opciones y recargo. Todo se completa antes de pagar.
- [ ] **Favoritos de la página principal:** selección y orden manual de 6–8 productos.
- [ ] **Campañas de temporada** (ver Implementación).
- [ ] **Relacionados:** selección manual de 3–4; si no hay, misma subcategoría; si tampoco, misma categoría.
- [ ] **Edición masiva:** filtros, búsqueda, selección múltiple, activar o desactivar, cambiar categoría o subcategoría y aplicar promoción (Paso 7).
- [ ] **Redirecciones 301:** al cambiar un slug se crea la redirección automáticamente, sin cadenas (la URL vieja apunta directo a la nueva), y se actualizan enlaces internos, canonical y sitemap. Un slug usado nunca se reutiliza.
- [ ] **API pública** de categoría, subcategoría, producto, campaña y manifiesto del configurador con los contratos del Paso 0; Angular SSR obtiene los datos en el servidor.
- [ ] Cargar el producto modelo Doctor con datos reales.

**Implementación acordada**

- **Regla de accesorios:** el elemento fijo va en la foto base y ocupa el slot izquierdo. El comprador elige exactamente la cantidad configurada (2 por defecto) entre hobbies, amor, mascotas, marco con foto y marco con frase. No cuentan el elemento fijo, el nombre, las gafas o lentes ni la dedicatoria. El precio extra por accesorio existe en el modelo (0 al inicio) para usarlo en el futuro.
- **Campañas de temporada:** URL fija sin año (`/san-valentin`; después `/dia-de-la-madre`, `/dia-del-padre`, `/navidad`), fechas anuales recurrentes (inicio, fin y fecha del evento), selección manual y ordenada de productos, imagen o video, texto, imagen social, promoción opcional y categoría relacionada. Laravel decide el estado: en temporada (`active`) aparece en la página principal y en el menú; fuera de temporada (`upcoming`) la URL responde con "{nombre} {año} llegará muy pronto", donde el año es el de la próxima temporada (en marzo de 2027, San Valentín muestra 2028). Sin redirecciones. Vista previa desde el panel.
- **Slugs iniciales:** `/profesiones-y-hobbies`, `/amor`, `/amistad`, `/familia`, `/profesiones-y-hobbies/salud`, `/profesiones-y-hobbies/administrativos`, `/profesiones-y-hobbies/fuerza-publica` y `/profesiones-y-hobbies/cocina-y-hobbies`.
- El SKU es estable: no se edita después de la primera venta y nunca se reutiliza. Es el mismo ID en web, pedidos, GA4, Meta, TikTok y feeds.
- El costo interno se copia a cada ítem del pedido al venderse; nunca se muestra al comprador.
- Si un producto se vende en dos versiones que se anuncian por separado (doctor y doctora), cada una es un producto con su propio SKU y URL.
- No se construye un editor visual de arrastrar y soltar para los slots.

**Datos y configuración.** Tablas `categories`, `subcategories`, `products`, `options`, `product_option`, `slots`, `slot_overrides`, `complement_fields`, `campaigns`, `campaign_products`, `featured_products`, `redirects`.

**Acción de Josué**

- Entregar la lista inicial de productos con SKU, nombre, categoría, subcategoría, precio ($25 de referencia), costo, tamaño, "qué incluye" y descripción.
- Entregar la lista de accesorios con sus variantes reales y los complementos con sus precios.
- Definir las subcategorías de Amor, Amistad y Familia, y los productos, fechas y orden de San Valentín.
- Validar en staging que puede crear y duplicar un producto completo sin ayuda.

**Terminado cuando**

- Josué crea un producto nuevo con su configurador y aparece en la web con su propia URL, sin intervención del desarrollador.
- Cambiar un slug crea la redirección y la URL vieja sigue funcionando.
- `/san-valentin` muestra el estado correcto según la fecha, también simulando marzo.

**Pruebas.** Crear, duplicar, editar, desactivar y reactivar un producto. Agotar un accesorio y verlo desaparecer del personalizador. Edición masiva sobre una subcategoría. Buscar "médico" y encontrar Doctor. Campaña en temporada, antes de empezar y después de terminar (muestra el año siguiente). Recargar la ficha y ver en el HTML del servidor el nombre y el precio.

**NO CAMBIAR.** Selector 2D con slots + overrides. Un solo panel Administrador. SKU estable compartido en todos los sistemas. Campañas con URL permanente y sin redirección fuera de temporada.

## Paso 6 — Medios y assets del configurador

**Objetivo.** Las fotos, videos y accesorios se ven nítidos y cargan rápido en el celular, y Josué los sube desde el panel sin procesarlos a mano.

**Dependencias.** Paso 5.

**Tareas**

- [ ] Al subir una foto de producto: conservar el original y generar WebP de \~600 px (galería) y \~1080 px (zoom), convertidos a sRGB.
- [ ] Al subir un video: validar MP4, duración y peso según su perfil (tabla de abajo). No se transcodifica en el servidor.
- [ ] Al subir un accesorio: conservar el maestro y generar el asset grande y la miniatura de 160 px.
- [ ] Manifiesto por producto con solo sus accesorios compatibles.
- [ ] Nombres de archivo con hash y caché permanente para todo medio público.
- [ ] Imagen social de 1200×630 en JPEG generada al subir la foto principal (producto centrado sobre fondo de marca), con campo para subir una propia que la reemplace.

**Implementación acordada**

**Perfiles de video** (límites estimados, a validar en pruebas)

| Perfil | Formato | Duración | Peso máximo | Reglas |
| --- | --- | --- | --- | --- |
| Ficha de producto | Vertical o cuadrado, dentro de la galería | 6–8 s | \~2 MB | Se descarga y reproduce solo con su lámina activa |
| Encabezado de categoría | Horizontal, tipo banner | 6–10 s | \~1,5 MB | Autoplay, silenciado, bucle, `playsinline`, portada y pausa fuera de pantalla |
| Página principal | Vertical o cuadrado, protagonista | 6–10 s | \~2,5 MB | Igual que categoría; el primer cuadro funciona como foto si el celular no reproduce automáticamente |

- Todos los videos: MP4 H.264, 720p, sin audio, con portada WebP; con "reducir movimiento", solo la portada.
- **Accesorios:** WebP con pérdida en el color y alfa sin pérdida (`-q 88 -alpha_q 100 -m 6 -sharp_yuv`). Si una pieza muestra artefactos, WebP sin pérdida. PNG solo como maestro.
- **Resolución:** suficiente para pantallas de alta densidad con zoom 2x.
- **Recorte de fondo:** borde suave de 1–2 px, sin halo, \~10 px de margen transparente. Revisión al 200% sobre fondo negro y blanco.
- **Variantes de color de lentes y gafas:** una foto real por color, en la misma posición exacta.
- **Carga del configurador:** al abrir una pestaña se cargan solo sus miniaturas. Al elegir un accesorio se muestra la miniatura ampliada al instante y se reemplaza cuando llega el asset grande.
- **Las fotos actuales son de ejemplo:** no se optimizan a mano; se reemplazan cuando Josué entregue las reales.

**Datos y configuración.** Extensiones de imagen de PHP en Hostinger (WebP en GD o Imagick). Tabla `media` con original, variantes, dimensiones, `alt` y rol (`front`, `video`, `angle`, `detail`, `scale`, `social`).

**Acción de Josué**

- Fotografiar productos con la misma composición (frontal, 3/4, detalle, escala) y cada accesorio y variante con el mismo ángulo y luz que la foto base.
- Exportar los videos según su perfil. Grabar el video principal con su esposa mostrando las macetas, con las macetas visibles desde el primer segundo.
- Aprobar el fondo de marca de la imagen social.

**Terminado cuando**

- La ficha modelo pesa menos de \~1,5 MB al abrir en celular (objetivo estimado).
- Abrir el configurador no descarga los accesorios de otras pestañas ni de otros productos.
- Compartir la ficha por WhatsApp muestra la imagen social completa, sin recortar la maceta.

**Pruebas.** Subir una foto y un video desde el celular. Subir un video de 15 s y comprobar que se rechaza. Revisar en la red del navegador qué se descarga al abrir cada pestaña del configurador.

**NO CAMBIAR.** Sin pipeline pesado de FFmpeg. Videos preparados antes de subir. Originales siempre conservados.

## Paso 7 — Precios, promociones y recargo por tarjeta

**Objetivo.** Un solo motor en Laravel calcula precios, descuentos, envío gratis y recargo por tarjeta, y el mismo número llega a la ficha, el carrito, el pedido, el feed, el JSON-LD y los eventos.

**Dependencias.** Paso 5.

**Tareas**

- [ ] Motor único `PricingService` con dos alcances: **catálogo** (precio mostrado en ficha y listados) y **carrito** (promociones automáticas, envío gratis y recargo).
- [ ] Panel de promociones: tipo (porcentaje o monto fijo), vigencia, categoría, subcategoría o productos específicos, exclusiones, activar o desactivar.
- [ ] Aplicación masiva sobre una categoría o una selección múltiple, sin cambiar el precio base de cada producto.
- [ ] Envío gratis automático desde 2 macetas.
- [ ] Recargo por pago con tarjeta según el porcentaje de `settings`.
- [ ] Endpoint que devuelve el objeto Precio del Paso 0 para cada producto.

**Implementación acordada**

- **Laravel calcula** precio base, precio final, descuento, porcentaje, vigencia y regla aplicada. Angular solo muestra: precio anterior tachado, final destacado y badge ("10% OFF").
- **Producto contra categoría:** no se suman; gana el descuento más favorable para el comprador.
- **Al terminar la vigencia,** el precio vuelve solo, sin intervención.
- **Envío gratis:** si `planter_count` es 2 o más, el envío es $0 en todas las zonas habilitadas. Solo cuentan macetas; dos macetas iguales cuentan como 2; los complementos no cuentan. Con macetas de $25, el ticket mínimo con envío gratis es $50.
- **Recargo por tarjeta (6%):** base = productos + extras y complementos + envío − descuentos. Se redondea a centavo (mitad hacia arriba), se muestra como línea separada "Recargo por pago con tarjeta (6%)" solo cuando se elige tarjeta y se guarda aparte (`card_fee_cents`). Es una decisión de negocio de Josué y no se reanaliza aquí.
- **`merchandise_value`:** productos netos de descuento, sin envío ni recargo. Es el `value` del Purchase en Meta, TikTok y GA4. Los reportes conservan el total cobrado y el recargo.
- **Cálculo en centavos enteros,** con redondeo a centavo por línea (mitad hacia arriba).
- **Copia en el pedido:** regla aplicada y descuento por línea, envío, recargo, `merchandise_value` y total.
- **Cupones:** fuera del lanzamiento. El motor no debe impedirlos más adelante.

**Datos y configuración.** Tabla `promotions` (alcance, tipo, valor, objetivos, vigencia, activa). Porcentaje de recargo en `settings`.

**Acción de Josué.** Definir las promociones de lanzamiento y validar en staging cómo se ven.

**Terminado cuando**

- Una promoción del 10% sobre una categoría muestra $25 tachado, $22,50 y "10% OFF" en todas sus fichas sin editar ningún producto.
- El total del carrito siempre coincide con el que calcula el servidor al crear el pedido.
- Un pedido con tarjeta muestra y guarda el recargo exacto; uno por transferencia no lo tiene.

**Pruebas**

- Descuento de producto y de categoría simultáneos: gana el mayor.
- 1 maceta (cobra envío); 2 macetas iguales (envío $0); 1 maceta + 3 complementos (cobra envío).
- Recargo: 2 macetas de $25 con 10% de descuento y envío gratis → base $45,00, recargo $2,70, total $47,70. 1 maceta de $25 a Zona A → base $28,50, recargo $1,71, total $30,21.
- Precio modificado desde las herramientas del navegador: el total no cambia.

**NO CAMBIAR.** Laravel es la autoridad de precios. Producto y categoría no se acumulan. Envío gratis desde 2 macetas. Recargo del 6% con tarjeta, en línea separada.

## Paso 8 — Calendario operativo y capacidad

**Objetivo.** Laravel sabe a qué ciclo pertenece cada pedido, cuándo se despacha, qué ventana se promete y cuánta capacidad queda, considerando domingos, feriados y cierres, sin sobreventa.

**Dependencias.** Paso 4 (`BusinessCalendar`, `settings`).

**Tareas**

- [ ] Tabla de días no hábiles con tipo (feriado nacional, feriado local de Guayaquil, cierre propio) y a qué afecta (producción, despacho o ambos).
- [ ] En el panel: bloquear un día, varios días o un rango; ver cada ciclo con pedidos pagados, pendientes y capacidad restante; cambiar la capacidad de un ciclo puntual.
- [ ] Botón **"Pasar las ventas al siguiente ciclo"** y su reverso, "Reabrir ciclo".
- [ ] Servicio de ciclo: dado un instante, devuelve ciclo, día de despacho y ventana.
- [ ] Servicio de capacidad con asignación dentro de una transacción que bloquea la fila del ciclo.
- [ ] Aviso en el panel si no hay feriados cargados para el año siguiente.

**Implementación acordada**

| Pedido hecho | Ciclo | Despacho | Entrega estimada |
| --- | --- | --- | --- |
| Lunes hasta 20:00 | Lunes | Miércoles | Jueves–viernes |
| Martes hasta 20:00 | Martes | Jueves | Viernes–sábado |
| Miércoles hasta 20:00 | Miércoles | Viernes | Sábado–lunes |
| Jueves hasta 20:00 | Jueves | Sábado | Lunes–martes |
| Viernes hasta 20:00 | Viernes | Lunes | Martes–miércoles |
| Sábado hasta 16:00 | Sábado | Martes | Miércoles–jueves |
| Sábado desde 16:00:01, domingo y lunes hasta 20:00 | Lunes | Miércoles | Jueves–viernes |

Regla general que reproduce la tabla y absorbe feriados y cierres:

1. **Ciclo:** el primer día habilitado para producción cuyo corte aún no pasó (corte inclusive).
2. **Despacho:** el segundo día habilitado para producción después del ciclo; si ese día no admite despacho, el siguiente día que sí lo admita.
3. **Ventana:** los dos primeros días de entrega válidos después del despacho. No son días de entrega válidos el domingo ni los feriados nacionales. Amazonía usa tres días (Paso 10).
4. Un bloqueo de producción o despacho mueve los ciclos siguientes sin dejar de vender.

**Capacidad**

- Se cuentan **pedidos**, no macetas: un pedido de 3 macetas es 1. Los pedidos de WhatsApp cargados en el panel también cuentan.
- **Comprometidos** de un ciclo = pagados + transferencias dentro de su plazo de 12 h + pagos con tarjeta en curso (15 min).
- La ficha ofrece un ciclo solo si tiene **menos de 8** comprometidos. Con 8, el pedido pasa al siguiente ciclo disponible y se le informa antes de pagar.
- Hasta **10** solo entran los pedidos con gracia (Paso 9) y las transferencias vencidas que Josué marca pagadas porque llegaron a tiempo (Paso 14). Superar 10 exige una excepción manual confirmada explícitamente; queda en el historial.
- **"Pasar las ventas al siguiente ciclo":** cierra el ciclo abierto para pedidos nuevos (su capacidad queda igual a sus comprometidos actuales). Los pedidos que ya tiene no cambian. "Reabrir ciclo" devuelve la capacidad configurada. Ambas acciones quedan en el historial.
- La capacidad nominal se cambia en `settings`; la de un ciclo puntual, desde su vista.
- Mover un pedido puntual a otro ciclo se hace desde el pedido (Paso 15).

**Datos y configuración.** Tablas `non_working_days` (fecha, tipo, afecta\_produccion, afecta\_despacho, afecta\_entrega, nota) y `cycles` (fecha, capacidad, override, cerrado\_manual). Cortes y capacidades en `settings`.

**Acción de Josué.** Cargar los feriados nacionales y locales del año y sus cierres conocidos. Revisar la tabla de ciclos con ejemplos reales.

**Terminado cuando**

- Para cada fila de la tabla, el servicio devuelve exactamente el ciclo, despacho y ventana indicados.
- Un bloqueo de varios días mueve las promesas sin errores y la tienda sigue vendiendo.
- Dos pedidos simultáneos nunca ocupan el mismo último cupo.
- Con el botón activado, el siguiente pedido recibe el ciclo siguiente.

**Pruebas**

- Pruebas automáticas de cada fila de la tabla, en los minutos del corte: 19:59:59, 20:00:00, 20:00:01 y sábado 16:00:00 / 16:00:01.
- Semana con feriado nacional y con feriado local. Cierre de 3 días por viaje.
- Concurrencia: 20 pedidos simultáneos sobre un ciclo con 7 comprometidos.
- Botón: activarlo con 5 comprometidos, crear un pedido (va al ciclo siguiente) y reabrir.

**NO CAMBIAR.** Capacidad nominal 8 y tolerancia 10. Se cuentan pedidos, no macetas. Domingo se vende pero no se produce ni se despacha. Servientrega recibe despachos de lunes a sábado. Ventanas estimadas, nunca fecha exacta garantizada.

## Paso 9 — Promesa de entrega, gracia y ventanas

**Objetivo.** La ficha muestra una promesa real y un contador confiable; quien empezó a personalizar antes del corte tiene 30 minutos de gracia; el comprador puede programar una ventana futura válida.

**Dependencias.** Paso 8.

**Tareas**

- [ ] Endpoint de promesa para la ficha (contrato del Paso 0), con `server_now` y `promise_token` firmado.
- [ ] Contador en Angular basado en la diferencia con `server_now`, nunca en el reloj del teléfono.
- [ ] La ficha vuelve a pedir la promesa al llegar el corte y al volver a la pestaña.
- [ ] Guardar el `promise_token` al tocar "Personalizar" y enviarlo al crear el pedido.
- [ ] Validar la gracia al crear el pedido.
- [ ] Endpoint de ventanas disponibles para "Programar para otra fecha".
- [ ] Mensaje tranquilo cuando la fecha cambió: "Actualizamos tu fecha estimada".
- [ ] Fecha límite de campaña.

**Implementación acordada**

- **Gracia de 30 minutos:** al crear el pedido, si el `promise_token` es válido, se emitió antes del corte de su ciclo, el corte pasó hace 30 minutos o menos y el ciclo tiene menos de 10 comprometidos, el pedido entra en ese ciclo. Si no, recibe el siguiente ciclo disponible y se le informa antes de pagar. No hay tabla de reservas ni señales de actividad: es una sola validación.
- **Ejemplo:** toca "Personalizar" el lunes a las 19:50 y crea el pedido a las 20:15 → ciclo lunes. Lo crea a las 20:35 → ciclo martes, con aviso antes de pagar.
- **La gracia no reserva capacidad.** La capacidad se asigna al crear el pedido.
- **No se muestra contador** durante la personalización.
- **Vuelve más tarde:** el carrito conserva las macetas y muestra la nueva ventana con "Actualizamos tu fecha estimada".
- **Calendario:** Laravel devuelve las ventanas válidas; Angular solo las dibuja. Tocar el 28 resalta 28–29; si el segundo día es domingo o no es día de entrega, salta al siguiente válido (por ejemplo, sábado + lunes). Las ventanas que el motor no puede cumplir aparecen deshabilitadas.
- **Ventana programada:** no usa gracia; se valida al crear el pedido con la regla de menos de 8. En la hoja de producción aparece en el ciclo que la despacha.
- **Textos:** debajo del calendario, "Entrega estimada por Servientrega. Las fechas corresponden a una ventana estimada de 24–48 horas." En ficha y calendario, discreto: "Región Amazónica: considera 1 día adicional." En el checkout de Amazonía se muestra la ventana corregida de tres días, sin la mención de 24–48 horas.
- **Fecha límite de campaña:** para una campaña con fecha (14 de febrero), Laravel calcula el último momento para pedir y recibir antes. La página muestra "Pide hasta el martes 9 para recibir antes del 14 de febrero".

**Datos y configuración.** Clave de firma del `promise_token`. Minutos de gracia (30) en `settings`.

**Acción de Josué.** Validar en staging un pedido alrededor del corte.

**Terminado cuando**

- Quien toca "Personalizar" a las 19:50 y crea el pedido a las 20:15 conserva su ventana.
- Quien lo crea a las 20:35 recibe la ventana siguiente, con aviso antes de pagar.
- Un token alterado no da gracia.

**Pruebas**

- Token emitido antes y después del corte; pedido a 29 y a 31 minutos del corte.
- Ciclo con 9 comprometidos + 3 pedidos con gracia: solo uno entra; los demás reciben la ventana siguiente antes de pagar.
- Cambiar la hora del teléfono: el contador no cambia.
- Calendario: domingo, feriado nacional y cierre propio como segundo día de la ventana.

**NO CAMBIAR.** La gracia no consume capacidad. El comprador elige ventanas, no fechas exactas. El contador usa la hora del servidor.

## Paso 10 — Ubicación, zonas y tarifas

**Objetivo.** Las direcciones usan siempre provincias, cantones y localidades válidos, y el envío y el tránsito se calculan por zona, editables desde el panel.

**Dependencias.** Pasos 4 y 8.

**Tareas**

- [ ] Precargar el Clasificador Geográfico Estadístico del INEC (versión 2026) con sus códigos (por ejemplo, Guayas `09`, Guayaquil `0901`). Mientras el backend no exista, convertirlo en un JSON para la pantalla de envío; ese mismo archivo alimenta después el seeder de Laravel.
- [ ] Localidades opcionales por cantón (por ejemplo, La Aurora, La Joya y Villa Club en Daule), editables desde el panel.
- [ ] Alias para el buscador: "La Puntilla" → Samborondón, "Vía a la Costa" → Guayaquil, "La Aurora" → localidad de Daule.
- [ ] API de búsqueda para los selectores escribibles de provincia, cantón y localidad.
- [ ] Zonas: tarifa, días de tránsito adicionales y disponibilidad; asignación por localidad, cantón o provincia.
- [ ] Ajuste manual del envío de un pedido puntual desde el panel, con motivo y registro en el historial.

**Implementación acordada**

- **Orden de resolución:** provincia → cantón → localidad (opcional) → zona. Prioridad de asignación: localidad > cantón > zona de respaldo (Zona B, la más cara). *(Cambio del 4 nov: la tabla por cantón sale de las tarifas reales de Servientrega; antes se asignaba por provincia.)*

| Zona | Asignación inicial | Tarifa | Tránsito |
| --- | --- | --- | --- |
| A | Cantones Guayaquil, Daule, Durán, Samborondón y Salitre; Daule completo, así que sus localidades (La Aurora, La Joya, Villa Club y Villa Italia) ya no necesitan regla propia | $3,50 | Base |
| B | Amazonía y los 140 cantones que Servientrega cobra igual ($7,02), según `zonas-envio.json` | $6,25 | +1 día (ventana de 3 días) |
| C | Cantones que Servientrega cobra $5,29 o $5,92 (71 cantones) | $5,00 (editable) | Base |
| No disponible | Galápagos, Taisha y Aguarico (se atienden por WhatsApp) | — | — |

- Si el comprador no elige localidad, se usa la asignación de su cantón (por ejemplo, Daule → Zona A; Santa Rosa está por confirmar con Servientrega y mientras tanto es Zona B).
- Galápagos muestra "Actualmente no realizamos envíos a Galápagos." No se calcula tarifa ni promesa y no se puede crear el pedido.
- La tarifa y la ventana final se recalculan en el checkout cuando se conoce la ubicación.
- El envío gratis desde 2 macetas es una regla del Paso 7, no una tarifa.
- Nunca texto libre para provincia, cantón ni localidad. Fuente única: el JSON del INEC dentro del proyecto; no se usan APIs externas de ubicaciones (countriesnow.space, por ejemplo, no trae cantones como Durán).

**Datos y configuración.** Tablas `provinces`, `cantons`, `localities`, `location_aliases`, `shipping_zones`, `zone_assignments`.

**Acción de Josué.** Confirmar con Servientrega el cantón de Santa Rosa (hoy Zona B provisional). Villa Italia ya no importa: todo Daule es Zona A.

**Terminado cuando.** Elegir cualquier cantón o localidad devuelve su zona, tarifa y ventana correctas, y Galápagos queda bloqueado.

**Pruebas.** Guayaquil, Durán, Samborondón, Daule con La Aurora (Zona A) y sin localidad (Zona C), Quito, Cuenca, Tena (Amazonía) y Puerto Ayora (Galápagos). Cambiar una tarifa en el panel y ver el nuevo valor en el checkout.

**NO CAMBIAR.** Sin retiro en taller. Servientrega como transportista estándar. Tarifas por zona. Galápagos no disponible. Zona A $3,50; Amazonía $6,25 y +1 día.

## Paso 11 — Carrito y cotización

**Objetivo.** El carrito vive en el navegador del comprador, admite varias macetas con personalizaciones distintas, y cada cambio se cotiza en Laravel, que aplica todas las reglas del carrito.

**Dependencias.** Pasos 5, 7 y 9.

**Tareas**

- [ ] Carrito en el almacenamiento del navegador, con versión de esquema; sobrevive a recargas en el mismo dispositivo.
- [ ] Endpoint de cotización (contrato del Paso 0): recibe los ítems y devuelve precios, totales, `incentives`, `identical_planters` y promesa.
- [ ] Agregar, editar, eliminar y cambiar cantidad (solo complementos), siempre recotizando.
- [ ] Upsells dentro del carrito según `incentives` (regla de la segunda maceta del Paso 1).
- [ ] Confirmación de macetas idénticas.
- [ ] Bloqueo del checkout sin macetas (`checkout_allowed`).
- [ ] Subida de fotos de marco como archivos temporales privados ligados al ítem; al crear el pedido pasan al pedido.

**Implementación acordada**

- **Macetas idénticas:** dos ítems son idénticos si coinciden SKU, nombre, gafas o lentes, accesorios con su slot, frase o foto y dedicatoria. Laravel los señala en `identical_planters` y Angular pregunta al agregar. Confirmadas, cuentan como 2.
- **Complementos:** nunca sin maceta. Con 0 macetas, `checkout_allowed` y `show_complements` son `false`; los complementos que ya estaban se conservan.
- **Fotos temporales:** las de carritos no convertidos se borran a los 14 días.
- **Atribución:** la capturada en el Paso 1 viaja con el checkout.
- Un pedido pendiente por transferencia ya no es carrito: es un pedido (Paso 14).
- Carrito guardado en el servidor, enlace de recuperación y correos de carrito abandonado: fuera del lanzamiento.

**Datos y configuración.** Tabla `uploads` (temporal, privada, con vencimiento).

**Acción de Josué.** Ninguna.

**Terminado cuando**

- Un carrito con tres macetas distintas sigue igual al recargar.
- Las reglas del carrito del Paso 1 funcionan con los valores que devuelve Laravel.

**Pruebas.** Carrito con 50 ítems y personalizaciones distintas. Precio cambiado en el panel con el carrito abierto: la cotización lo actualiza. Dos macetas idénticas. Solo complementos.

**NO CAMBIAR.** Guest checkout sin login. Upsells dentro del carrito, sin pantalla extra. Complementos solo con maceta.

## Paso 12 — Checkout, clientes y creación del pedido

**Objetivo.** El checkout crea un pedido completo y correcto: precios recalculados por el servidor, capacidad asignada sin sobreventa, cliente identificado, términos aceptados, atribución guardada y personalización copiada por ítem.

**Dependencias.** Pasos 7 a 11.

**Tareas**

- [ ] Validaciones en el servidor de todos los campos: cédula (10 dígitos con dígito verificador) o RUC (13 dígitos, con la validación de su tipo); teléfono y correo normalizados (+593…, minúsculas, sin espacios). No se acepta pasaporte.
- [ ] Facturación: por defecto, los datos de envío; si el comprador elige "otros datos", se guardan aparte (nombre, cédula o RUC, correo, dirección).
- [ ] Número de contacto: por defecto, el celular de envío; si elige "otro número", se guarda ese.
- [ ] Validar que haya al menos una maceta y que cada maceta tenga sus accesorios completos, la frase o la foto si el marco la requiere, y dedicatoria o "No quiero dedicatoria".
- [ ] Rechazar el pedido sin la casilla de términos (`terms_required`).
- [ ] Crear o actualizar el cliente (Paso 23).
- [ ] Guardar el tracking del Paso 0 más la IP real y el user agent que toma Laravel.
- [ ] Recalcular precios, descuentos, envío, recargo y total; si difieren de lo mostrado, devolver `price_changed` y mostrar el nuevo total antes de pagar.
- [ ] Asignar ciclo y ventana en una transacción (Pasos 8 y 9), aplicando la gracia si corresponde.
- [ ] Crear el pedido con pago `unpaid` (tarjeta) o `pending_validation` (transferencia), número `JDS-####`, UUID, token privado aleatorio y `event_id` de compra.
- [ ] Copiar a cada ítem: SKU, nombre del producto, precio, costo, descuento, personalización completa, nombre de placa, gafas o lentes, accesorios con su slot, frase o foto y dedicatoria.

**Implementación acordada**

- **Identidad del cliente:** correo + número de contacto. Los datos de envío pertenecen al pedido, porque pueden ser de quien recibe el regalo. El checkout no separa comprador y receptor.
- **Términos:** una sola casilla obligatoria y desmarcada, sin casilla de marketing (decisión de Josué, 5 nov). Se guarda aceptación, fecha y hora, versión del texto, pedido, IP y user agent. La arquitectura queda lista para cargar los textos legales cuando Josué los entregue.
- **Consentimiento de marketing:** no hay casilla en el checkout (decisión de Josué, 5 nov). Si más adelante se quiere pedir ese permiso, se define aparte (Paso 23).
- **Sin edición del comprador:** una vez creado el pedido, pendiente o pagado, el comprador no lo edita. Solo Josué corrige desde el panel (Paso 15).
- **`event_id`:** lo genera Laravel al crear el pedido: `purchase-<uuid del pedido>`. Es el mismo en navegador, Conversions API, TikTok y reintentos.
- **Facturación SRI:** solo se capturan los datos; la factura la emite Josué manualmente.

**Datos y configuración.** Tablas `customers`, `orders`, `order_items`, `order_addresses` (envío y facturación), `order_attribution`, `terms_acceptances`.

**Acción de Josué.** Validar en staging que el pedido creado tiene toda la información que necesita para facturar y producir.

**Terminado cuando**

- Un pedido de 3 macetas distintas guarda las 3 personalizaciones completas, con precios, costos, envío y recargo copiados.
- El mismo cliente comprando dos veces con el mismo correo queda como un solo cliente.
- Ningún valor que envía Angular decide el total.

**Pruebas.** Cédula y RUC inválidos. Pedido sin términos. Maceta con 1 accesorio enviada directo a la API. Facturación y contacto distintos. Precio modificado desde el navegador. Pedido con 50–100 ítems. Pedido justo en el corte, dentro de la gracia y con el ciclo lleno.

**NO CAMBIAR.** Checkout aprobado: envío, facturación igual al envío por defecto, contacto igual al celular de envío por defecto. Solo cédula o RUC. Términos obligatorios. Guest checkout. Facturación SRI manual. Sin edición del comprador después de crear el pedido.

## Paso 13 — Pago con tarjeta: PayPhone Cajita

**Objetivo.** Un pago con tarjeta solo marca el pedido como pagado cuando Laravel lo confirma con PayPhone, con el monto correcto, sin duplicados y resistente a recargas, doble clic y cancelaciones.

**Dependencias.** Paso 12. **Antes de usar dinero real: resolver las dos preguntas externas a PayPhone.**

**Tareas**

- [ ] Tabla de intentos de pago por pedido, con `clientTransactionId` único (máximo 50 caracteres; por ejemplo `JDS-2048-1`) y monto esperado en centavos.
- [ ] Integrar la Cajita en Angular con los datos que entrega Laravel.
- [ ] Ruta de respuesta que recibe `id` y `clientTransactionId` y llama al backend.
- [ ] Confirmación en Laravel contra PayPhone.
- [ ] Endpoint de Notificación Externa (webhook), según la respuesta de PayPhone.
- [ ] Pantalla de error amable con opción de reintentar.

**Implementación acordada**

1. **Laravel** crea el intento con su `clientTransactionId` y el monto calculado por el servidor (incluido el recargo por tarjeta), y lo devuelve a Angular.
2. **Angular** muestra la Cajita con StoreID, token, `clientTransactionId`, montos y referencia del pedido, y bloquea el botón después del primer clic.
3. **PayPhone** redirige a la URL de respuesta configurada en la app de PayPhone (no en el script), con `id` y `clientTransactionId`.
4. **Laravel**, dentro de los **5 minutos** posteriores al pago, llama a `POST https://paymentbox.payphonetodoesposible.com/api/confirm` con `{ "id": ..., "clientTxId": "..." }`. Si no se confirma en ese plazo, PayPhone revierte el cobro.
5. **Valida** que el estado sea Approved (código 3), que el `clientTransactionId` corresponda al intento y que el monto sea el esperado. Guarda `transactionId` (índice único) y código de autorización. Todo en una transacción que bloquea el intento.
6. **Si está pagado:** confirma la capacidad, marca el pago `paid`, guarda el pedido en la sesión y redirige a `/checkout/confirmacion` (sin token). Encola correos y eventos de servidor.

**Casos**

- **Cancelado o rechazado (código 2):** intento fallido; el pedido sigue sin pagar y puede reintentar con un intento nuevo.
- **Doble clic:** un solo intento activo por pedido; el backend devuelve el mismo mientras no venza.
- **Recarga de la página de respuesta:** si el intento ya está confirmado, devuelve el resultado guardado sin reprocesar.
- **Cajita vencida:** el formulario vence a los 10 minutos; se crea un intento nuevo.
- **Pago duplicado:** si el pedido ya está pagado, no se crean más intentos; si llegan dos aprobados, se avisa a Josué para reembolsar uno (Paso 18).
- **Monto alterado en el navegador:** si no coincide con el pedido, no se marca pagado y se avisa a Josué (Paso 18).
- **Cierra el navegador después de pagar:** se resuelve con la Notificación Externa: al recibirla, Laravel llama a Confirm de inmediato (pendiente de confirmar con PayPhone).
- **Reserva de capacidad** durante el pago: 15 minutos; si no se paga, se libera.

**Datos y configuración.** StoreID y Token por entorno; dominio y URL de respuesta registrados en cada app de PayPhone; tabla `payment_attempts`.

**Credenciales.** Según la documentación de PayPhone, la Cajita usa el token en el navegador; su tratamiento está pendiente de confirmar con PayPhone. Jamás van en Angular: token de Conversions API, token de TikTok, API secret de GA4, contraseñas SMTP, credenciales de la base y `APP_KEY`.

**Acción de Josué**

- Crear las apps de Pruebas y Producción en Payphone Business y entregar StoreID y Token de cada una.
- Registrar dominio y URL de respuesta de cada ambiente.
- Solicitar la Notificación Externa (aprobación de 3–5 días hábiles).
- Hacer las dos preguntas externas pendientes y compartir las respuestas.

**Terminado cuando**

- En staging: aprobado, rechazado, cancelado, vencido, doble clic, recarga y monto alterado se comportan como se describe.
- En producción: una compra real de bajo monto queda pagada con su código de autorización.

**Pruebas.** Todos los casos de arriba con la app de Pruebas. Cerrar el navegador justo después de pagar y verificar el resultado con la Notificación Externa.

**NO CAMBIAR.** PayPhone Cajita de Pagos. Confirmación siempre desde Laravel. Purchase solo con pago confirmado.

## Paso 14 — Transferencia y pedido pendiente

**Objetivo.** Un pedido por transferencia aparta su fecha durante 12 horas, el comprador sube su comprobante en la web o lo envía por WhatsApp, y Josué solo marca "Pagado" después de revisar el banco.

**Dependencias.** Pasos 8 y 12.

**Tareas**

- [ ] Al elegir transferencia: pedido con pago `pending_validation`, cupo apartado y plazo = creación + 12 h.
- [ ] Página de pedido pendiente (Paso 1) con cuentas, hora límite, "Subir comprobante" y WhatsApp.
- [ ] Subida del comprobante (JPG, PNG o PDF) al disco privado, con límite de intentos; se guarda la hora de subida.
- [ ] Botón de WhatsApp que pasa por un endpoint propio, registra el clic y abre `wa.me` con "Hola 🌿 Te envío el comprobante de mi pedido JDS-2048." y el total.
- [ ] Aviso a Josué al subirse un comprobante (Paso 18).
- [ ] Acciones en el panel: "Marcar pagado", "Pagado fuera de plazo" y "Cancelar".
- [ ] Vencimiento automático al cumplirse el plazo.

**Implementación acordada**

- **Plazo fijo de 12 horas** desde la creación del pedido. Todo pedido creado antes del corte de las 20:00 vence a más tardar a las 08:00 del día siguiente, antes de empezar la producción.
- **Mientras corre el plazo,** el pedido aparta su ciclo y cuenta en la capacidad.
- **Josué valida:** revisa el banco (con el comprobante subido o el que llegó por WhatsApp) y marca "Pagado". En ese momento: pago `paid`, correo de pago confirmado con el enlace de seguimiento, Purchase desde el servidor (Paso 20) y el pedido entra a producción con su ciclo.
- **Al vencer sin marcar,** el pedido pasa a `expired`, libera el cupo y el comprador recibe el correo de pedido vencido con un enlace para volver a comprar. No se borra.
- **Pagó a tiempo pero se vio tarde:** Josué puede marcar "Pagado" un pedido vencido; conserva su ciclo aunque supere 8 (hasta 10; más de 10 pide confirmación explícita).
- **Pagó fuera de plazo:** "Pagado fuera de plazo" asigna el siguiente ciclo disponible y actualiza la ventana.
- **Ejemplo:** pedido creado el lunes a las 19:50 → plazo martes 07:50. Comprobante el martes a las 07:00 → ciclo lunes, despacho miércoles, entrega jueves–viernes.
- El clic en WhatsApp se registra, pero no es requisito para validar un pago.
- Probar emojis en el mensaje `wa.me` en Android, iPhone y WhatsApp Web; si alguno se rompe, el mensaje va sin emojis.

**Datos y configuración.** Campos en `orders`: `transfer_deadline_at`, `receipt_uploaded_at`, `receipt_upload_id`, `whatsapp_clicked_at`, `expired_at`. Cuentas bancarias, número de WhatsApp y horas de plazo en `settings`.

**Acción de Josué.** Entregar el texto exacto de las cuentas bancarias y el número oficial de WhatsApp. Validar el mensaje prellenado.

**Terminado cuando**

- Un pedido creado a las 19:50 muestra "Paga antes del martes 07:50", aparta su cupo y vence solo a esa hora si nadie lo marca.
- Un comprobante subido avisa a Josué y aparece junto al pedido en el panel.
- Un pedido vencido marcado como pagado conserva su ciclo.

**Pruebas.** Plazo con pedidos creados a las 10:00, 19:50 y 21:00. Subir comprobante en JPG y en PDF. Vencimiento automático. Pagado dentro y fuera de plazo. Pedido de 30 ítems: el mensaje de WhatsApp sigue siendo compacto.

**NO CAMBIAR.** Transferencia como método de pago. Plazo de 12 horas. Comprobante por la web o por WhatsApp. Validación manual de Josué. Purchase solo con pago validado.

## Paso 15 — Pedidos: estados, WhatsApp, correcciones e historial

**Objetivo.** Todos los pedidos, de la web y de WhatsApp, viven en un solo panel; cada uno sabe su estado y su historial, y Josué puede corregirlo sin entrar a la base de datos.

**Dependencias.** Pasos 12, 13 y 14.

**Tareas**

- [ ] Dimensiones en `orders`: estado de pago, estado operativo, canal (`web` o `whatsapp`) y facturado (glosario del Paso 0).
- [ ] **Pedido de WhatsApp desde el panel:** el mismo formulario de productos y personalización que la web, datos del comprador y zona; precio con el mismo motor (envío ajustable con motivo); ciclo y ventana con las reglas de capacidad (Josué puede elegir una ventana programada); pago pendiente hasta "Marcar pagado".
- [ ] **Corregir un pedido:** Josué edita la personalización o los datos de envío y facturación hasta que el pedido esté "Enviado"; cada cambio queda con autor, antes y después.
- [ ] Mover un pedido de ciclo, con recálculo de la ventana.
- [ ] Cancelar con motivo (libera el cupo) y registrar el reembolso manual (el de tarjeta se hace en el panel de PayPhone).
- [ ] Marcar "En producción" y "Enviado" (con guía), también por lote (Paso 19).
- [ ] Historial `order_events`, solo de escritura.

**Implementación acordada**

- **Listo para producción** = pago confirmado.
- **Pedidos de WhatsApp:** cuentan en la capacidad y aparecen en la hoja de producción, la lista de envíos, "Por facturar" y los reportes. Reciben los mismos correos si tienen correo. **Nunca se envían como Purchase** a Meta, TikTok ni GA4, para no mezclar ventas de chat con las de la web.
- **Cancelaciones y reembolsos:** nunca automáticos. Josué cambia el estado, escribe el motivo y el monto reembolsado si aplica; el sistema libera el cupo y lo registra. El correo de cancelación sale solo si Josué marca "Notificar al comprador".
- **Historial:** pedido creado, canal, método de pago, comprobante subido, clic en WhatsApp, pago validado, vencimiento, cambio de ciclo o de ventana, corrección, correo enviado, en producción, enviado, facturado, cancelado y reembolsado. Cada evento con fecha, hora y autor (sistema, comprador o administrador).
- **Estados visibles:** Pendiente de pago (solo transferencia) → Confirmado → En producción → Enviado; Cancelado y Reembolsado cuando correspondan. No existe "Entregado".

**Datos y configuración.** Tabla `order_events` (tipo, payload, autor, fecha). Campos `channel`, `invoiced_at` e `invoice_number` en `orders`.

**Acción de Josué.** Validar en staging, desde el celular, la carga de un pedido de WhatsApp y una corrección.

**Terminado cuando.** Un pedido de WhatsApp cargado en el panel ocupa capacidad, sale en la hoja de producción y no genera ningún evento de compra en las plataformas.

**Pruebas.** Pedido de WhatsApp con transferencia. Corregir un nombre y ver el cambio en el historial y en la hoja de producción. Mover de ciclo. Cancelar un pedido pagado y ver el cupo liberado.

**NO CAMBIAR.** Un solo sistema para pedidos de la web y de WhatsApp. Cancelaciones nunca automáticas. Sin "Entregado" porque no hay API de Servientrega. El comprador no edita; Josué sí, con historial.

## Paso 16 — Seguimiento privado

**Objetivo.** El comprador consulta su pedido sin cuenta, desde cualquier dispositivo y en cualquier momento, sin exponer sus datos a terceros.

**Dependencias.** Paso 15.

**Tareas**

- [ ] `/pedido/{token}` con token aleatorio largo (no adivinable): si el pedido está pagado muestra el seguimiento; si es una transferencia pendiente, la vista de pedido pendiente (Paso 14); si venció o se canceló, su estado.
- [ ] Seguimiento: número de pedido, estado visible, ventana, productos con el nombre personalizado, total y la guía de Servientrega si se cargó.
- [ ] El enlace va en el correo de pedido recibido (transferencia) y en el de pago confirmado.
- [x] Página "Consultar mi pedido" con número de pedido + correo. *(Hecho en `/consultar-pedido` con mock `ConsultaPedidoService`: misma respuesta exista o no el pedido y sin mostrar datos; el límite de intentos y el envío del correo los hace Laravel.)*
- [ ] Ayuda por WhatsApp con el mensaje prellenado del Paso 1.

**Implementación acordada**

- La página con token lleva `noindex`, no va en el sitemap y no carga GTM, Meta, TikTok ni GA4.
- La confirmación después del pago es otra ruta, `/checkout/confirmacion`, sin token; esa sí puede cargar los pixeles.
- "Consultar mi pedido" nunca muestra datos en pantalla: reenvía al correo del pedido su enlace privado. La respuesta es la misma exista o no el pedido, y tiene límite de intentos.
- La respuesta lleva `Cache-Control: private, no-store`; Cloudflare no la guarda.

**Terminado cuando.** El enlace del correo abre el pedido en otro dispositivo días después, y la página no aparece en las solicitudes de red de ninguna plataforma publicitaria.

**Pruebas.** Abrir el enlace en otro celular. Cambiar un carácter del token (404). Consultar con datos correctos e incorrectos (misma respuesta). Revisar en la red del navegador que no se carga ningún pixel.

**NO CAMBIAR.** Guest checkout. Sin login obligatorio. Seguimiento por token. Sin "Entregado".

## Paso 17 — Correos del pedido

**Objetivo.** Cada momento clave del pedido envía automáticamente un correo fijo, con datos reales y formato de marca, sin duplicados y sin que Josué redacte nada.

**Dependencias.** Pasos 4 y 15.

**Tareas**

- [ ] Configurar el correo con SMTP autenticado de Hostinger (nunca `mail()`).
- [ ] Crear los registros DNS de correo en Cloudflare.
- [ ] Plantillas fijas de la tabla de abajo, con textos aprobados por Josué.
- [ ] Clave de idempotencia por correo: pedido + motivo.
- [ ] Registrar en `order_events` cada correo enviado.

**Correos del lanzamiento**

| Motivo | Cuándo | Contenido |
| --- | --- | --- |
| Pedido recibido | Se crea un pedido por transferencia | Total, cuentas, hora límite, enlace al pedido pendiente para subir el comprobante y WhatsApp |
| Pago confirmado | Tarjeta aprobada o transferencia marcada como pagada | Resumen, ventana de entrega y enlace de seguimiento |
| Enviado | El pedido se marca "Enviado" | Guía de Servientrega si se cargó, ventana y enlace de seguimiento |
| Pedido vencido | Vence el plazo de 12 h sin pago | Aviso de vencimiento y enlace para volver a comprar |
| Cancelado | Solo si Josué marca "Notificar al comprador" | Motivo breve y reembolso, si aplica |

**Implementación acordada**

- **Correo al comprador:** host `smtp.hostinger.com`, puerto 465 con SSL (alternativa 587 con STARTTLS); usuario = buzón que envía.
- **Remitente:** `pedidos@jardindesele.com`, nombre "Jardín de Sele". Responder a: `hola@jardindesele.com`.
- **Avisos al administrador:** salen de `sistema@` hacia `alertas@`, separados del buzón de clientes para no consumir su límite diario ni su reputación.
- **DNS en Cloudflare:** MX `mx1.hostinger.com` y `mx2.hostinger.com`; SPF `v=spf1 include:_spf.mail.hostinger.com ~all` (un solo registro SPF); DKIM con los tres CNAME `hostingermail-a/b/c._domainkey` y los valores de hPanel; DMARC `v=DMARC1; p=none; rua=mailto:dmarc@jardindesele.com`, que pasa a `quarantine` tras 2–4 semanas de reportes limpios.
- **Solo transaccionales** desde estos buzones. El marketing masivo, cuando exista, irá por una herramienta separada.
- **Fechas** en español y hora de Guayaquil: "martes 10 de noviembre, 07:50".
- **Límite diario de envío:** los buzones gratuitos de Hostinger envían hasta 100 correos al día y Business Starter hasta 1.000; con unos 20 pedidos diarios hace falta el plan de pago.
- Motor de mensajes por bloques, mensajes de WhatsApp generados por el sistema e historial de textos: fuera del lanzamiento.

**Datos y configuración.** Plantillas en el código (Blade) con los textos aprobados; registro en `order_events`.

**Acción de Josué**

- Crear los buzones `pedidos@`, `hola@`, `sistema@`, `alertas@` y `dmarc@`.
- Confirmar en hPanel el límite diario de su plan de correo.
- Aprobar los textos de cada correo.

**Terminado cuando**

- Un correo de pedido llega a la bandeja principal de Gmail con SPF, DKIM y DMARC aprobados.
- Reintentos de la cola o un doble clic no envían el mismo correo dos veces.

**Pruebas.** Cada motivo con datos reales de staging. Revisar los encabezados de autenticación en Gmail.

**NO CAMBIAR.** SMTP autenticado de Hostinger. Correos `@jardindesele.com`. Transaccionales separados del marketing.

## Paso 18 — Avisos al administrador

**Objetivo.** Josué se entera al momento de lo que necesita su decisión y llega directo al pedido desde el celular.

**Dependencias.** Pasos 4, 14, 15 y 17.

**Tareas**

- [ ] Correo de `sistema@` a `alertas@` para cada aviso, con asunto "JDS-2048 · motivo" (sin nombre, teléfono ni dirección del comprador).
- [ ] Botón principal en cada aviso que abre el pedido en el panel (`/admin/pedidos/{id}`); sin sesión, pasa por el login y vuelve al pedido.
- [ ] Resumen diario a las 08:00.

**Avisos del lanzamiento**

- Nuevo pedido pagado con tarjeta.
- Comprobante de transferencia subido.
- Pedido vencido.
- Pago con monto que no coincide o pago duplicado en PayPhone.
- Fallas técnicas (Paso 25).

**Resumen diario de las 08:00:** transferencias con comprobante sin marcar (incluidas las que vencieron de madrugada), transferencias pendientes sin comprobante y pedidos del ciclo que se produce ese día.

**Implementación acordada**

- **Ninguna acción sensible se ejecuta desde el correo:** marcar pagado, cancelar, reembolsar, mover de ciclo o superar la capacidad requieren sesión, ver el contexto y una acción explícita en el panel (POST + CSRF), y quedan en el historial.
- Solo se aceptan rutas internas del panel en la redirección del login (sin redirección abierta).
- Centro de tareas con prioridades, recordatorios repetidos y cierre automático: fuera del lanzamiento.

**Datos y configuración.** Hora del resumen en `settings`.

**Acción de Josué**

- Configurar `alertas@` en el celular con notificaciones.
- Probar que la app de correo abre los enlaces en Safari o Chrome; si usa su propio navegador interno y pide login cada vez, cambiar esa opción.

**Terminado cuando.** Un comprobante subido genera el aviso y el botón abre el pedido en el celular (o pasa por el login y vuelve a él).

**Pruebas.** Cada aviso y el resumen en staging. Enlace sin sesión. Intentar una ruta externa en la redirección del login (debe rechazarse).

**NO CAMBIAR.** Un solo panel Administrador. Sin app móvil propia ni Web Push. Las acciones sensibles nunca se ejecutan desde un enlace.

## Paso 19 — Panel de operación

**Objetivo.** Josué produce, despacha y factura cada día desde el panel, sin abrir pedido por pedido, sin entrar a MariaDB y sin un ERP.

**Dependencias.** Pasos 8, 15 y 18.

**Tareas**

- [ ] **Vista por ciclo:** pedidos pagados, transferencias pendientes y capacidad restante, con el botón "Pasar las ventas al siguiente ciclo".
- [ ] **Hoja de producción por día de despacho,** imprimible y sin precios (detalle abajo).
- [ ] **Lista de envíos del ciclo** para crear las guías de Servientrega (detalle abajo).
- [ ] **"Enviado" por lote:** se cargan las guías en la lista, se seleccionan los pedidos y se marcan juntos; cada comprador recibe su correo con su guía.
- [ ] **Facturación:** filtro "Por facturar" (pagados sin facturar), datos de facturación con botón copiar por campo, marca "Facturado" individual o por lote y número de factura opcional.
- [ ] **Pedidos:** búsqueda y filtros por estado, canal, ciclo, método de pago, campaña y anuncio de origen; exportación CSV.
- [ ] **Excepciones:** mantener una ventana, superar la capacidad de 10 con confirmación explícita y ajustar el envío de un pedido.
- [ ] **Disponibilidad:** agotar o activar productos y accesorios.
- [ ] Lista de búsquedas sin resultados de los últimos 30 días (Paso 1).

**Hoja de producción** (una por día de despacho)

- Encabezado: ciclo asignado, fecha de despacho y ventana de entrega.
- Por pedido: número, canal, método y estado de pago, zona (Amazonía con su ventana de 3 días), ventana del pedido y si fue programado.
- Por maceta: modelo, nombre de placa con botón "Copiar texto de placa" (para pegarlo en el software de impresión sin errores de tildes ni ñ), gafas o lentes con su color, los accesorios con su slot, la frase o la foto del marco (miniatura y descarga), dedicatoria y complementos.
- Los pedidos programados aparecen en la hoja del ciclo que los despacha, no en la del día en que se compraron.
- Un pedido conserva el ciclo en que se creó. Ejemplo: creado el lunes a las 19:50, con comprobante el martes a las 07:00 → ciclo lunes, despacho miércoles, entrega jueves–viernes.

**Lista de envíos**

- Por pedido: número, destinatario, cédula o RUC, celular, provincia, cantón, localidad, dirección, referencia y campo para la guía.
- Exportable a CSV, imprimible y con botón copiar por fila.

**Implementación acordada**

- Un accesorio agotado deja de ofrecerse en el personalizador; un producto agotado muestra "Agotado" y no se puede agregar.
- Toda excepción, cambio de estado y marca de facturado queda en `order_events`.
- Contador de insumos con alerta: fuera del lanzamiento.

**Datos y configuración.** Vistas imprimibles con estilos de impresión.

**Acción de Josué.** Validar la hoja de producción y la lista de envíos con un ciclo de prueba.

**Terminado cuando.** Josué imprime la hoja de producción del ciclo, crea las guías desde la lista, marca el lote como enviado y cada comprador recibe su correo; los pedidos quedan en "Por facturar" hasta marcarlos.

**Pruebas.** Hoja con 10 pedidos y 30 macetas, incluidos uno programado y uno de WhatsApp. Lista de envíos exportada. Lote enviado con guías. Marcar facturado por lote. Excepción por encima de 10. Accesorio agotado que desaparece del personalizador.

**NO CAMBIAR.** Sin ERP. Un solo rol Administrador. Facturación SRI manual con marca "Facturado".

## Paso 20 — Tracking y atribución

**Objetivo.** GA4, Meta y TikTok reciben el embudo desde el navegador y las compras reales desde el servidor, sin duplicados, y cada venta queda ligada a su fuente, campaña, anuncio, landing y producto.

**Dependencias.** Pasos 1, 12, 13 y 14. Cuentas del Paso 2.

**Tareas**

- [ ] Contenedor GTM web; la función `track()` de Angular empuja al `dataLayer` y GTM reparte a GA4, Meta Pixel y TikTok Pixel.
- [ ] Envío de compras desde Laravel a Meta Conversions API, TikTok Events API y GA4 Measurement Protocol, por la cola.
- [ ] Registro `tracking_events`: plataforma, evento, `event_id`, pedido, respuesta o error.
- [ ] Aviso de cookies simple; los pixeles se cargan según la elección del visitante.
- [ ] Atribución: primer toque en el cliente, último toque en el pedido.
- [ ] Convención de UTMs documentada para Josué.

**Plan de eventos**

| Evento | Disparador | GA4 | Meta | TikTok | Servidor |
| --- | --- | --- | --- | --- | --- |
| Vista de página | Cada ruta (excepto `/pedido/{token}`) | `page_view` | PageView | Pageview | No |
| Ver producto | Carga de la ficha | `view_item` | ViewContent | ViewContent | No |
| Empezar personalización | Toque en "Personalizar" | `start_customization` | — | — | No |
| Agregar al carrito | Guardar la maceta en el carrito | `add_to_cart` | AddToCart | AddToCart | No |
| Segunda maceta desde el carrito | Upsell de segunda maceta | `add_to_cart` con `source=cart_upsell` | AddToCart | AddToCart | No |
| Ver carrito | Abrir `/carrito` | `view_cart` | — | — | No |
| Abrir "Ver más" | Modal de sugeridos | `open_more_products` | — | — | No |
| Iniciar checkout | Entrar a `/checkout` | `begin_checkout` | InitiateCheckout | InitiateCheckout | No |
| Datos de envío | Completar envío | `add_shipping_info` | — | — | No |
| Método de pago | Elegir tarjeta o transferencia | `add_payment_info` | AddPaymentInfo | AddPaymentInfo | No |
| Pedido por transferencia | Confirmación de transferencia | `place_order` | — | — | No |
| Compra con tarjeta | Confirm aprobado | `purchase` (solo servidor) | Purchase navegador + servidor | Purchase navegador + servidor | Sí |
| Compra por transferencia | Josué valida el pago | `purchase` (solo servidor) | Purchase servidor | Purchase servidor | Sí |

**Eventos de experiencia (solo GA4):** `select_subcategory`; `search` (término y cantidad de resultados); `select_item` con la lista de origen (categoría, búsqueda, relacionados, carrito, campaña, favoritos); `select_delivery_window`; `whatsapp_click` con el lugar donde se tocó. El abandono del personalizador y del checkout se calcula con los eventos existentes; no se miden reproducciones de video ni profundidad de scroll.

**Pedidos de WhatsApp cargados en el panel:** nunca envían eventos a Meta, TikTok ni GA4; se reportan aparte como canal WhatsApp.

**Implementación acordada**

- **Purchase solo con pago real confirmado.**
- **GA4:** `purchase` sale únicamente desde el servidor por Measurement Protocol, con `client_id` y `session_id` capturados en el checkout y `transaction_id` = número de pedido. Nunca desde el navegador.
- **Meta y TikTok con tarjeta:** el navegador dispara Purchase solo en `/checkout/confirmacion`, después del Confirm exitoso; el servidor envía el mismo evento con el mismo `event_id` y el mismo nombre.
- **Meta y TikTok con transferencia:** solo servidor, al validar.
- **`event_id`:** `purchase-<uuid del pedido>`, generado al crear el pedido e idéntico en reintentos.
- **TikTok** usa el evento `Purchase` (`CompletePayment` es el nombre anterior).
- **Parámetros:** `content_ids` = SKU, `content_type` = product, `value` = merchandise\_value (productos netos de descuento, sin envío ni recargo por tarjeta) en USD, `currency` USD, `num_items`.
- **Datos de usuario en servidor:** correo y teléfono en hash, `external_id` (ID del cliente en hash), `fbp`, `fbc` (si falta la cookie, se construye desde `fbclid` con formato `fb.1.<timestamp>.<fbclid>`), `ttclid`, `ttp`, IP real, user agent y `event_source_url`.
- **Consentimiento:** si el visitante rechazó marketing, no se envían eventos de servidor a Meta ni a TikTok.
- **Ventanas de las plataformas:** GA4 acepta compras de hasta 72 h atrás; Meta, hasta 7 días (si un evento del lote es más viejo, rechaza el lote entero). Cada Purchase se envía en su propia petición.
- **UTMs:** `utm_source=meta|tiktok`, `utm_medium=paid`, `utm_campaign` y `utm_content` con el **ID** del anuncio (parámetros dinámicos), no el nombre.
- No se envían microeventos de UX a Meta ni a TikTok.

**Datos y configuración.** GTM ID, GA4 Measurement ID y API secret, Meta Pixel ID y token, TikTok Pixel ID y token, `test_event_code` en staging.

**Acción de Josué.** Entregar los IDs y tokens del Paso 2. Usar la convención de UTMs en todos los anuncios.

**Terminado cuando**

- En Events Manager de Meta y TikTok, una compra con tarjeta aparece como navegador + servidor deduplicada.
- Una transferencia validada aparece solo como servidor.
- En GA4, cada compra aparece una sola vez, atribuida a su sesión.
- El panel muestra la campaña y el anuncio de cada pedido.

**Pruebas.** Compra con tarjeta y por transferencia en staging con eventos de prueba. Rechazar cookies y verificar que no salen eventos de marketing. Pedido entrado con `?utm_campaign=prueba&fbclid=test`.

**NO CAMBIAR.** GA4 purchase solo desde servidor. Purchase solo con pago real. Sin GTM del lado del servidor: Laravel llama directo a las APIs.

## Paso 21 — Catálogo de Meta

**Objetivo.** Un generador produce el catálogo de Meta desde la misma base de productos, con el mismo SKU y precio que la web, para que el remarketing muestre el producto exacto que cada persona vio.

**Dependencias.** Pasos 5, 6, 7 y 20.

**Tareas**

- [ ] Generador en Laravel: `/feeds/meta.csv`, preparado para agregar después TikTok y Google.
- [ ] Regeneración programada (cada hora) y al cambiar un producto o una promoción.
- [ ] Conectar el catálogo de Meta al dataset (Pixel) para que los eventos con `content_ids` coincidan con los productos.

**Implementación acordada**

- **Campos obligatorios:** `id` (= SKU), `title`, `description`, `availability`, `condition` (new), `price`, `link`, `image_link`, `brand` (Jardín de Sele) y categoría de Google o de Facebook.
- **Campos adicionales:** `sale_price` y `sale_price_effective_date` cuando hay promoción; `custom_label_0` = categoría; `custom_label_1` = subcategoría.
- **Precio** = precio base y precio final del Paso 7. Nunca otro cálculo.
- **Imagen:** la foto principal del producto.
- Solo macetas activas; los complementos no van al catálogo porque no se compran solos.
- Feeds de TikTok y Google, y Merchant Center: fuera del lanzamiento.

**Datos y configuración.** Categoría de Google o Facebook asignada por categoría propia, en `settings`.

**Acción de Josué.** Crear el catálogo en Meta y conectarlo al dataset.

**Terminado cuando.** Meta muestra el catálogo sin errores y su diagnóstico confirma que los eventos coinciden con los productos.

**Pruebas.** Cambiar un precio o una promoción y ver el feed actualizado. Desactivar un producto y verlo fuera del feed.

**NO CAMBIAR.** El mismo SKU en web, pedidos, analítica y Meta. Catálogo de Meta desde el lanzamiento.

## Paso 22 — SEO técnico y vista previa social

**Objetivo.** Google entiende la marca, las categorías y los productos, y cada enlace compartido por WhatsApp, Facebook o LinkedIn se ve con título, descripción e imagen correctos.

**Dependencias.** Pasos 5, 6, 7 y 21.

**Tareas**

- [ ] Título, meta description y canonical únicos por página, editables desde el panel, renderizados en SSR.
- [ ] Open Graph y Twitter Cards en SSR: home con la marca, categoría con su imagen, producto con su imagen social.
- [ ] JSON-LD: `Organization` en la home; `Product` + `Offer` (precio final, moneda, disponibilidad) en cada producto.
- [ ] `AggregateRating`: no se publica mientras no existan reseñas verificadas (fuera del lanzamiento).
- [ ] `sitemap.xml` generado desde la base: home, categorías, productos y políticas.
- [ ] `robots.txt` propio: bloquear `/carrito`, `/checkout`, `/pedido/` y `/api`, incluir `Sitemap:` y conservar las señales de contenido de Cloudflare.
- [ ] 404 con código real 404. Redirecciones 301 de `/catalogo/*` y de slugs cambiados.
- [ ] Favicon en 32×32 y 180×180; `lang="es"`.
- [ ] Manifest de PWA solo con nombre, íconos y color de tema; sin service worker.

* [ ] Pantalla de categorías, categorías, subcategorías y campañas en el sitemap, con título, descripción e imagen social propios. Las campañas permanecen todo el año: fuera de temporada muestran "llegará muy pronto" y siguen indexables.

**Implementación acordada**

- **Imagen social:** generada automáticamente en 1200×630 JPEG (Paso 6) con override manual. Respaldo: producto → imagen social del producto; categoría → imagen de categoría; home → imagen oficial de marca.
- Los testimonios nunca se marcan como calificación de un producto.
- `noindex` en producción hasta el día del lanzamiento (Paso 27).
- Sin estrategia masiva de contenido ni blog.

**Datos y configuración.** Search Console con propiedad de dominio verificada por registro TXT en Cloudflare. GA4 vinculado a Search Console.

**Acción de Josué.** Crear la propiedad de Search Console y dar acceso al desarrollador. Después del lanzamiento, importar el sitio en Bing Webmaster Tools desde Search Console. Aprobar la imagen oficial de marca.

**Terminado cuando**

- La Prueba de resultados enriquecidos de Google valida un producto sin errores.
- `/sitemap.xml` abre y está enviado en Search Console.
- Un enlace de producto compartido por WhatsApp muestra imagen, título y descripción.

**Pruebas.** Ver el HTML del servidor de home, categoría y producto con sus metadatos. Depurador de enlaces de Facebook. URL vieja de `/catalogo` redirigida.

**NO CAMBIAR.** SSR correcto por ruta. SEO técnico profesional sin producción masiva de contenido. Sin service worker.

## Paso 23 — Clientes, consentimientos y políticas

**Objetivo.** Laravel sabe quién compra, qué y por qué campaña, respeta los permisos de cada cliente y publica las políticas que exige la ley, dejando los datos listos para los reportes que vienen después.

**Dependencias.** Pasos 12, 15 y 20.

**Tareas**

- [ ] Ficha de cliente: nombre, correo y teléfono normalizados, canal de origen, primer toque, consentimientos y pedidos.
- [ ] Métricas desde pedidos pagados: número de pedidos, total comprado, ticket promedio, primera y última compra.
- [ ] Tabla de consentimientos con historial y baja en un clic en cada correo de marketing, cuando exista marketing.
- [ ] Aviso de cookies simple; los pixeles se cargan según la elección del visitante (Paso 20).
- [ ] Página de términos y condiciones con versión y fecha (una sola página; incluye envíos, cambios, cancelaciones, devoluciones y datos del cliente). *(Texto oficial de Josué ya publicado en `/terminos-y-condiciones` con mock; falta la tabla `policies` con versión y fecha en Laravel, por eso sigue sin marcar. Ya no hay páginas separadas de privacidad, envíos ni cambios.)*
- [ ] Registro de la aceptación de términos por pedido (Paso 12).

**Implementación acordada**

- **Identidad:** correo + número de contacto. Los datos de envío son del pedido, no del cliente.
- **Datos del pedido** (para cumplir la compra) separados del **consentimiento de marketing** (casilla desmarcada).
- **Consentimientos:** cliente, canal, propósito, sí o no, fecha, origen y versión del texto. Retirar el permiso agrega una fila; nunca se sobrescribe.
- **Retención:** fotos de personalizaciones no compradas, 14 días; fotos de pedidos, unos meses después del envío (plazo definido por Josué); pedidos, según el plazo tributario.
- **Desde el primer día se guardan** canal, campaña, anuncio y montos de cada pedido, para el reporte de costo por pedido y la exportación de clientes a Meta, que están fuera del lanzamiento.
- El email marketing masivo no se construye en la web.

**Datos y configuración.** Tablas `customers`, `consents` y `policies` (versión, texto, fecha).

**Acción de Josué**

- Términos y condiciones: texto entregado el 5 de noviembre (única página legal). Falta el aviso de cookies, aprobado con un abogado.
- Definir el plazo de conservación de las fotos de pedidos.

**Terminado cuando.** Las políticas están publicadas con su versión, el aviso de cookies controla los pixeles y cada pedido guarda la versión de términos aceptada.

**Pruebas.** Cliente que compra dos veces. Rechazar cookies y ver que no cargan los pixeles. Cambiar la versión de términos y verla en el siguiente pedido.

**NO CAMBIAR.** Laravel/MariaDB como fuente de verdad. Checkout sin separar comprador y receptor. Sin CRM empresarial.

## Paso 24 — Testimonios

**Objetivo.** La web muestra desde el lanzamiento testimonios reales elegidos por Josué, para dar confianza a quien llega desde la publicidad.

**Dependencias.** Paso 5.

**Tareas**

- [ ] Testimonios en el panel: texto, nombre o iniciales, ciudad opcional, foto opcional, producto opcional, orden y activo.
- [ ] Sección de testimonios en la página principal y en la ficha (primero los del producto, si tiene).

**Implementación acordada**

- Solo testimonios reales con permiso de uso.
- Se muestran como testimonios, nunca como reseñas verificadas ni en datos estructurados (sin `AggregateRating`).
- Reseñas verificadas con solicitud automática: fuera del lanzamiento.

**Datos y configuración.** Tabla `testimonials`.

**Acción de Josué.** Entregar 6–10 testimonios reales con permiso de uso (texto y, si hay, foto).

**Terminado cuando.** La página principal y la ficha muestran testimonios administrados desde el panel.

**Pruebas.** Desactivar un testimonio y verlo desaparecer. Ficha con y sin testimonios propios.

**NO CAMBIAR.** Los testimonios no se presentan como reseñas verificadas.

## Paso 25 — Rendimiento, backups y monitoreo

**Objetivo.** La web carga rápido en datos móviles, nada sensible queda en caché, los datos se pueden recuperar y cualquier falla avisa sola.

**Dependencias.** Todos los pasos anteriores construidos.

**Tareas**

- [ ] Revisar con PageSpeed Insights mobile la home, una categoría y la ficha modelo.
- [ ] Reglas de caché en Cloudflare: HTML público cacheable; sin caché para `/pedido/*`, `/api`, `/admin`, carrito, checkout y fotos privadas.
- [ ] Bloques dinámicos (promesa, contador, precio promocional, carrito) pedidos a la API después de cargar el HTML, nunca dentro del HTML cacheado.
- [ ] Purgar la caché de Cloudflare al cambiar productos, precios o promociones.
- [ ] Lobster en WOFF2 con solo caracteres latinos, precargada.
- [ ] Backups: los de Hostinger + copia semanal fuera de Hostinger (base de datos y carpeta de fotos privadas).
- [ ] Probar una restauración completa en staging.
- [ ] Monitoreo: aviso de caídas (consultando la home cada 5 minutos, que además mantiene despierta la app Node), errores, última ejecución del scheduler, trabajos fallidos, eventos rechazados por las plataformas y fallas de pago.
- [ ] Resumen diario de salud a `alertas@`.

**Implementación acordada**

- **Fotos privadas de marcos:** disco privado de Laravel fuera de `public`, nombre UUID, ligadas al ítem, servidas solo por ruta autenticada o URL firmada temporal, con `Cache-Control: private, no-store` y sin extensión de imagen en la ruta. Al subir: validar tipo y tamaño, recodificar y quitar EXIF (ubicación GPS).
- **HEIC:** verificar si el PHP de Hostinger lo convierte; si no, confirmar que el iPhone lo envía como JPEG.
- **Arranque en frío de Node:** medir cuánto tarda Hostinger en detener la app sin tráfico; el monitor cada 5 minutos la mantiene activa si ese tiempo es mayor.
- No se considera correcto un backup que no se haya restaurado.

**Datos y configuración.** Token de API de Cloudflare con permiso solo de purga de caché.

**Acción de Josué.** Crear el token de purga de Cloudflare con permiso limitado. Indicar dónde se guarda la copia externa (por ejemplo, el Drive de la empresa).

**Terminado cuando**

- La ficha modelo tiene LCP menor a 2,5 s en PageSpeed mobile.
- Una restauración en staging recupera pedidos y fotos privadas.
- Apagar el cron, romper un trabajo o tumbar la web genera alertas.

**Pruebas.** Red lenta 4G simulada. Cambiar una promoción y ver la ficha actualizada. Abrir una URL firmada vencida (debe fallar).

**NO CAMBIAR.** Sin S3 ni infraestructura externa salvo la copia de respaldo. Sin WAF empresarial. Sin pentest como requisito inicial.

## Paso 26 — QA final de punta a punta

**Objetivo.** Todo el recorrido funciona en celulares reales antes de invertir en publicidad.

**Dependencias.** Pasos 0 a 25.

**Tareas**

- [ ] Seeder con datos ficticios, incluido un pedido de 50–100 macetas con personalizaciones distintas.
- [ ] Ejecutar cada caso en Android y iPhone reales con datos móviles, y en escritorio.
- [ ] Registrar cada fallo como incidencia y repetir hasta que todo pase.

**Casos**

- [ ] **Rutas y SSR:** entrar directo, recargar y compartir home, categorías, subcategoría, producto, campaña y políticas; 404 real; redirecciones de `/catalogo`.
- [ ] **Página principal y categorías:** video, botón a categorías, pestañas con URL y regreso con contexto.
- [ ] **Búsqueda:** con y sin resultados, sin tildes, botones de categorías y de WhatsApp.
- [ ] **Producto:** galería, video solo en su lámina, precio con descuento, promesa, fecha futura, testimonios y relacionados.
- [ ] **Personalizador:** nombres de 5, 15, 28 y 30 caracteres; exactamente 2 accesorios; gafas por color; marco con foto (pequeña e inválida) y con frase (60 y 61 caracteres); dedicatoria con emojis y "No quiero dedicatoria".
- [ ] **Carrito:** 1 y 2 macetas, volver a 1, macetas idénticas, solo complementos, segunda maceta desde el carrito y recarga.
- [ ] **Precios:** descuento de producto y de categoría; envío gratis desde 2 macetas; recargo del 6%; precio manipulado desde el navegador.
- [ ] **Entrega:** cada fila de la tabla de ciclos; cortes exactos; gracia a 29 y 31 minutos; feriado nacional, local y cierre; capacidad 8 y 10; botón de siguiente ciclo; ventana programada; Amazonía; Galápagos bloqueado.
- [ ] **Zonas:** asignación por cantón, por localidad y de respaldo.
- [ ] **Pagos:** PayPhone aprobado, rechazado, cancelado, interrumpido, doble clic, recarga y monto alterado; transferencia con comprobante por la web y por WhatsApp, vencimiento a las 12 h, pagado vencido y fuera de plazo.
- [ ] **Pedidos:** pedido de WhatsApp, corrección, mover de ciclo y cancelación; seguimiento en otro dispositivo; "Consultar mi pedido".
- [ ] **Correos y avisos:** cada correo y cada aviso, sin duplicados; `wa.me` con emojis en Android, iPhone y Web.
- [ ] **Operación:** hoja de producción, lista de envíos, envío por lote con guías, "Por facturar" y "Facturado".
- [ ] **Tracking:** eventos del embudo; Purchase deduplicado con tarjeta; Purchase por servidor en transferencia; ningún evento de pedidos de WhatsApp; GA4 sin duplicados; cookies rechazadas; atribución en el panel.
- [ ] **Catálogo y SEO:** catálogo de Meta sin errores, resultados enriquecidos, Open Graph en WhatsApp y Facebook, sitemap.
- [ ] **Campañas:** San Valentín en temporada, antes y después (año siguiente), con fecha límite.
- [ ] **Seguridad:** `/.env` inaccesible, IP real, límites de intentos, rutas privadas sin caché, URL firmada vencida y acciones sin CSRF rechazadas.
- [ ] **Continuidad:** restauración de backup y alerta del scheduler detenido.
- [ ] **Accesibilidad básica:** textos alternativos, etiquetas de formularios, contraste y botones fáciles de tocar.
- [ ] **Navegadores dentro de apps:** recorrido completo en Instagram, Facebook y TikTok, incluidos la Cajita, la subida de fotos y comprobantes, WhatsApp, el video y el regreso a la categoría.

**Acción de Josué.** Ejecutar el recorrido completo como comprador en su celular y aprobar el resultado.

**Terminado cuando.** Todos los casos pasan en staging y no queda ninguna incidencia crítica abierta.

**NO CAMBIAR.** No se lanza con casos críticos pendientes.

## Paso 27 — Lanzamiento

**Objetivo.** La web pasa a producción con pagos, tracking, correos y operación verificados con una compra real.

**Dependencias.** Paso 26 aprobado y el checklist general de lanzamiento completo.

**Tareas (día del lanzamiento, en este orden)**

1. Backup de la base de producción.
2. Desplegar en producción la etiqueta aprobada en staging.
3. Cambiar PayPhone a la app de Producción.
4. Quitar el `noindex` de producción.
5. Activar las redirecciones de `/catalogo/*`.
6. Enviar el sitemap en Search Console e inspeccionar 3–4 URLs clave.
7. Hacer una compra real de bajo monto con tarjeta y una por transferencia, y recorrerlas hasta "Enviado".
8. Verificar en Events Manager de Meta y TikTok y en GA4 que aparecen las compras, deduplicadas.
9. Importar el sitio en Bing Webmaster Tools desde Search Console.
10. Recién entonces, subir la inversión publicitaria.

**Implementación acordada.** Durante la primera semana, comparar cada día los pedidos pagados del panel con las compras registradas en Meta. Si no cuadran, el problema es de tracking y se revisa `tracking_events` antes de juzgar los anuncios.

**Acción de Josué.** Hacer las dos compras reales y aprobar el lanzamiento.

**Terminado cuando.** Las dos compras reales llegaron completas al panel, al seguimiento, a los correos y a las plataformas.

**NO CAMBIAR.** No se lanza sin compra real completa probada.

## Índice de pasos

| Paso | Nombre | Depende de |
| --- | --- | --- |
| 0 | Contratos de datos y glosario | — |
| 1 | Cierre del frontend funcional | 0 |
| 2 | Propiedad, cuentas y accesos | — (en paralelo con 1) |
| 3 | Repositorio, entornos, staging y despliegue | 2 |
| 4 | Base técnica del backend | 3 |
| 5 | Catálogo y panel de productos | 0, 1, 4 |
| 6 | Medios y assets del configurador | 5 |
| 7 | Precios, promociones y recargo por tarjeta | 5 |
| 8 | Calendario operativo y capacidad | 4 |
| 9 | Promesa de entrega, gracia y ventanas | 8 |
| 10 | Ubicación, zonas y tarifas | 4, 8 |
| 11 | Carrito y cotización | 5, 7, 9 |
| 12 | Checkout, clientes y creación del pedido | 7–11 |
| 13 | Pago con tarjeta: PayPhone Cajita | 12 + preguntas externas |
| 14 | Transferencia y pedido pendiente | 8, 12 |
| 15 | Pedidos: estados, WhatsApp, correcciones e historial | 12–14 |
| 16 | Seguimiento privado | 15 |
| 17 | Correos del pedido | 4, 15 |
| 18 | Avisos al administrador | 4, 14, 15, 17 |
| 19 | Panel de operación | 8, 15, 18 |
| 20 | Tracking y atribución | 1, 12–14 |
| 21 | Catálogo de Meta | 5–7, 20 |
| 22 | SEO técnico y vista previa social | 5–7, 21 |
| 23 | Clientes, consentimientos y políticas | 12, 15, 20 |
| 24 | Testimonios | 5 |
| 25 | Rendimiento, backups y monitoreo | 0–24 |
| 26 | QA final de punta a punta | 0–25 |
| 27 | Lanzamiento | 26 |

## Checklist general de lanzamiento

No se lanza hasta que todo esté marcado.

- [ ] QA crítico del Paso 26 aprobado, sin incidencias críticas abiertas.
- [ ] Preguntas externas a PayPhone respondidas e implementadas.
- [ ] PayPhone de Producción validado con una compra real.
- [ ] Transferencia real con comprobante subido, marcada como pagada desde el panel, con su aviso y sus correos.
- [ ] Tracking real verificado: Purchase deduplicado en Meta y TikTok y una sola vez en GA4.
- [ ] Correos llegando a la bandeja principal con SPF, DKIM y DMARC aprobados.
- [ ] Avisos de `sistema@` llegando a `alertas@` en el celular de Josué.
- [ ] Backups automáticos activos y una restauración probada.
- [ ] Scheduler, cola, errores y caídas monitoreados.
- [ ] Sitemap enviado, `noindex` retirado, robots correcto y redirecciones de `/catalogo` activas.
- [ ] Catálogo de Meta sin errores.
- [ ] Panel operativo en el celular: hoja de producción, lista de envíos, envío por lote y "Por facturar".
- [ ] Políticas publicadas y textos de términos y consentimiento aprobados.
- [ ] Feriados del año y cierres cargados.
- [ ] Página de San Valentín con productos, fechas y fecha límite.
- [ ] Compra real completa probada de punta a punta.

## Acciones de Josué / propietario

**Urgentes (frenan el lanzamiento)**

- [ ] PayPhone: apps de Pruebas y Producción, StoreID y Token de cada una, dominios y URLs de respuesta, solicitud de la Notificación Externa (3–5 días hábiles) y las dos preguntas externas.
- [ ] Textos legales aprobados con un abogado: términos y condiciones (entregados el 5 de noviembre, una sola página) y aviso de cookies.
- [ ] Fotos y videos reales: video principal con su esposa, cada producto, cada accesorio y una foto por cada color de gafa y de lente.
- [ ] Lista de productos con SKU, nombre, categoría, subcategoría, precio, costo, tamaño, "qué incluye" y descripción; accesorios y complementos con sus precios.
- [ ] GitHub del negocio: crear la cuenta (correo propio y verificación en dos pasos), coordinar la fecha y aceptar la transferencia del repositorio.
- [ ] Mockup de la pantalla de categorías.

**Cuentas y accesos** (Paso 2)

- [ ] Hostinger: acceso compartido de hPanel; confirmar SSH, ruta de PHP para cron, versión de PHP parcheada, versión de Node, segunda app Node y segunda base para staging, y límite diario del plan de correo.
- [ ] Cloudflare: invitar al desarrollador con rol limitado; crear el token de purga de caché.
- [ ] Meta: Business Manager, dominio verificado, dataset (Pixel) ID, token de Conversions API, catálogo conectado al dataset y acceso parcial del desarrollador.
- [ ] TikTok: Business Center, Pixel ID, token de Events API y acceso del desarrollador.
- [ ] Google (cuenta de la empresa): GA4 de producción y de prueba, Measurement ID, API secret de Measurement Protocol, contenedor GTM y Search Console.
- [ ] Correo: buzones `pedidos@`, `hola@`, `sistema@`, `alertas@` y `dmarc@`; `alertas@` configurado en el celular.
- [ ] Monitoreo: cuentas de errores y de caídas a su correo.
- [ ] Bing Webmaster Tools: importar desde Search Console después del lanzamiento.

**Datos y contenido**

- [ ] HEX oficial del dorado.
- [ ] Imagen oficial de marca y fondo de la imagen social.
- [ ] Cuentas bancarias y número oficial de WhatsApp.
- [ ] Feriados nacionales y locales del año, y cierres conocidos.
- [ ] Cantón de Santa Rosa (El Oro) con Servientrega. *(Villa Italia ya no importa: todo Daule es Zona A.)*
- [ ] Subcategorías de Amor, Amistad y Familia.
- [ ] Favoritos de la página principal (6–8 productos).
- [ ] San Valentín: productos, orden, fechas y promoción si aplica.
- [ ] Promociones de lanzamiento.
- [ ] 6–10 testimonios reales con permiso de uso.
- [ ] Imprimir una frase de 60 caracteres en un marco real para validar el límite.
- [ ] Plazo de conservación de las fotos de pedidos.

**Decisiones y validaciones**

- [ ] Acordar con el desarrollador la revisión de cada viernes en staging.
- [ ] Aprobar la estructura del frontend con mocks (Paso 1).
- [ ] Validar en staging cada paso donde se le indica.
- [ ] Aprobar los textos de los correos.
- [ ] Ejecutar el QA como comprador y aprobar el lanzamiento.
- [ ] Hacer las dos compras reales del lanzamiento.

## Preguntas externas pendientes

Deben resolverse antes de implementar pagos reales (Paso 13). No bloquean los demás pasos.

1. **PayPhone — token de la Cajita en el navegador.** La documentación de la Cajita coloca el token en el JavaScript del navegador y el mismo token se usa para confirmar. ¿Existe una credencial limitada para el frontend? Si no, ¿qué recomiendan para proteger ese token? (Alternativa mínima: una app de PayPhone exclusiva para la web.)
2. **PayPhone — pago aprobado con navegador cerrado.** Si el cliente paga y cierra el navegador antes de volver a la URL de respuesta, no se llama a Confirm y PayPhone revierte a los 5 minutos. ¿La Notificación Externa evita esa reversión, o el comercio debe llamar a Confirm al recibirla? ¿Llega a tiempo para hacerlo dentro de los 5 minutos?

**Verificaciones en cuentas propias** (no son preguntas a terceros, pero dependen de la cuenta):

- Hostinger: SSH, ruta de PHP para cron, segunda app Node y base para staging, límite diario de envío del plan de correo, extensiones PHP de imagen (WebP y HEIC), tiempo de inactividad que detiene la app Node.
- PayPhone: si la app de Pruebas acepta el subdominio de staging.
- TikTok: ventana máxima de antigüedad para eventos enviados por Events API.

## Decisiones abiertas — NO INVENTAR

Si la implementación llega a uno de estos puntos, se construye la estructura y se pregunta a Josué; no se completa con suposiciones.

| Tema | Qué falta | Mientras tanto |
| --- | --- | --- |
| Textos legales | Privacidad, términos, envíos, cambios, consentimiento y cookies | Páginas y versiones listas, con texto provisional marcado como borrador |
| Reembolsos | Cuánto se devuelve, en qué casos y en qué plazo | Se registra a mano el monto que decida Josué |
| Zona A | Cantón de Santa Rosa y nuevas localidades | Localidades editables en el panel |
| Zona C | Tarifa futura | $5,00 editable |
| Complementos | Cuáles habrá y qué campos piden | Esquema de campos listo, sin complementos inventados |
| Excepciones por producto | Modelos con otra cantidad de accesorios o accesorios con precio extra | Cantidad configurable (2) y precio extra en $0 |
| Subcategorías | Las de Amor, Amistad y Familia | Esas categorías se muestran sin pestañas hasta que se definan |
| Frase del marco | Confirmar 60 caracteres con una impresión real | 60 en `settings` |
| Textos de correos | Redacción final | Plantillas con textos base para aprobar |

## Decisiones que no deben reabrirse

Estas decisiones ya fueron evaluadas y acordadas con el negocio. Si durante la implementación aparece una razón técnica real para revisar alguna, se conversa con Josué y el cambio se aplica en todos los pasos que afecte, para que el documento siga siendo coherente.

**Arquitectura**

- Stack: Angular + Angular SSR, Laravel/PHP, MariaDB, Hostinger Unlimited, Cloudflare, Git.
- Backend en Laravel (PHP) sobre el plan Hostinger Unlimited ya contratado por 3 años, con PHP siempre en una versión con parche de seguridad al día (PHP2Shell corregido desde 8.4.27 y 8.5.12).
- Laravel es la autoridad de precios, descuentos, recargo, envío, fechas, ventanas, capacidad, estados y reglas. Angular solo representa.
- Cola con driver `database`; sin Redis ni Horizon inicialmente.
- Sin microservicios, sin Kubernetes, sin GTM del lado del servidor, sin WAF empresarial, sin pentest como requisito inicial.
- Staging separado en subdominio, con datos, pagos, analítica y correos aislados.
- Repositorio en una cuenta de GitHub del negocio, con el desarrollador como colaborador.

**Experiencia y venta**

- Guest checkout siempre; sin login obligatorio ni login social.
- Sin retiro en taller.
- Página principal con video y botón a la pantalla de categorías; categorías y subcategorías como pestañas con URL propia.
- El producto es una página real; al volver, la categoría conserva su estado. Sin modales apilados.
- Todo se completa antes de pagar; no existe información pendiente.
- Elemento fijo en la foto base y exactamente 2 accesorios elegibles por defecto.
- Dedicatoria solo texto, hasta 250 caracteres, o "No quiero dedicatoria". Frase del marco hasta 60 caracteres.
- Nombre en placa: máximo 30 caracteres; producción entre 11 y 12,5 con referencia 12; vista previa vectorial con Lobster que nunca estira ni bloquea nombres válidos.
- Texto dorado con color sólido real.
- Upsells dentro del carrito; segunda maceta ofrecida solo con 1 maceta; complementos nunca sin maceta; confirmación de macetas idénticas.
- Checkout: envío, facturación igual al envío por defecto y contacto igual al celular de envío por defecto; solo cédula o RUC; términos obligatorios.
- Sin edición del comprador después de crear el pedido.
- Sin botón flotante de WhatsApp.
- Campañas de temporada con URL permanente; fuera de temporada, "llegará muy pronto" con el año de la próxima temporada, sin redirección.
- El seguimiento existe solo para pedidos pagados; el pedido pendiente tiene su propia vista.
- Fotos actuales de ejemplo; el configurador usa una imagen real por cada variante de color.

**Pagos y operación**

- PayPhone Cajita de Pagos y transferencia bancaria.
- Recargo del 6% con tarjeta, en línea separada; `merchandise_value` como valor del Purchase.
- Envío gratis desde 2 macetas; los complementos no cuentan.
- Transferencia con plazo fijo de 12 horas, comprobante por la web o por WhatsApp y validación manual de Josué.
- Purchase solo con pago real confirmado; GA4 purchase solo desde el servidor; los pedidos de WhatsApp nunca se envían como Purchase.
- Un solo sistema para pedidos de la web y de WhatsApp.
- Facturación SRI manual con marca "Facturado".
- Servientrega sin API; no existe el estado "Entregado".
- Ventanas estimadas, nunca fecha exacta garantizada.
- Capacidad de 8 pedidos por ciclo y tolerancia de 10; se cuentan pedidos; botón manual para pasar al siguiente ciclo; gracia de 30 minutos.
- Zonas por localidad > cantón > provincia; Zona A $3,50, Zona C $5, Amazonía $6,25 y +1 día; Galápagos no disponible.
- Cancelaciones y reembolsos nunca automáticos.
- Un solo panel Administrador; sin roles por ahora; sin ERP.
- Correo por SMTP autenticado de Hostinger, nunca `mail()`; transaccionales separados de marketing.

## Referencias técnicas oficiales

- [PayPhone: Cajita de Pagos](https://docs.payphone.app/cajita-de-pagos-payphone)
- [PayPhone: configuración de ambiente y credenciales](https://docs.payphone.app/configuracion-de-ambiente-y-credenciales)
- [PayPhone: notificación externa](https://docs.payphone.app/notificacion-externa)
- [Meta: deduplicación de eventos Pixel y Conversions API](https://developers.facebook.com/documentation/ads-commerce/conversions-api/deduplicate-pixel-and-server-events)
- [Meta: uso de Conversions API (ventana de 7 días)](https://developers.facebook.com/documentation/ads-commerce/conversions-api/using-the-api)
- [Meta: parámetros de información del cliente](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/customer-information-parameters)
- [Meta: referencia de campos del catálogo](https://developers.facebook.com/documentation/ads-commerce/catalog/reference)
- [TikTok: deduplicación de eventos](https://ads.tiktok.com/resources/help/article/event-deduplication?lang=en)
- [TikTok: eventos estándar actualizados](https://ads.tiktok.com/resources/help/article/how-to-adopt-tiktoks-updated-standard-events?lang=en)
- [GA4: Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events)
- [Google: datos estructurados de producto](https://developers.google.com/search/docs/appearance/structured-data/product)
- [Hostinger: límites por plan](https://www.hostinger.com/support/6976044-parameters-and-limits-of-hosting-plans-in-hostinger/)
- [Hostinger: configuración SMTP](https://www.hostinger.com/support/1575756-how-to-get-email-account-configuration-details-for-hostinger-email/)
- [Hostinger: registros DNS de correo con nameservers externos](https://www.hostinger.com/support/8671319-set-up-a-domain-for-hostinger-email-manually/)
- [Laravel: colas](https://laravel.com/docs/11.x/queues)
- [Google WebP: cwebp](https://developers.google.com/speed/webp/docs/cwebp)
