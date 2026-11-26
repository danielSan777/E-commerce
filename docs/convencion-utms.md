# Convención de UTMs para los anuncios

Para que cada pedido del panel muestre de qué campaña y de qué anuncio vino, todos los anuncios pagados llevan estos parámetros en el enlace de destino. Se escriben una sola vez, con parámetros dinámicos de la plataforma, y no se cambian a mano.

| Parámetro | Valor | Para qué sirve |
| --- | --- | --- |
| `utm_source` | `meta` o `tiktok` | La plataforma |
| `utm_medium` | `paid` | Siempre `paid` en anuncios pagados |
| `utm_campaign` | **ID** de la campaña (parámetro dinámico) | Qué campaña vendió |
| `utm_content` | **ID** del anuncio (parámetro dinámico) | Qué anuncio vendió |
| `utm_term` | No se usa | — |

Se usa el **ID** y no el nombre, porque el nombre cambia y el ID no. El panel traduce el ID al nombre cuando haga falta.

## Cómo queda el enlace

**Meta** (Parámetros de URL del anuncio, pestaña «Seguimiento»):

```
utm_source=meta&utm_medium=paid&utm_campaign={{campaign.id}}&utm_content={{ad.id}}
```

**TikTok** (Parámetros de URL del anuncio):

```
utm_source=tiktok&utm_medium=paid&utm_campaign=__CAMPAIGN_ID__&utm_content=__CID__
```

Antes de usarlos, confirma en la propia plataforma que `{{campaign.id}}`, `{{ad.id}}`, `__CAMPAIGN_ID__` y `__CID__` son los parámetros dinámicos vigentes para el ID de campaña y el ID de anuncio: cada plataforma los puede renombrar.

`fbclid` (Meta) y `ttclid` (TikTok) los agrega cada plataforma sola; no hay que escribirlos.

## Reglas

- Todos los anuncios pagados, sin excepción, llevan los cuatro parámetros.
- No se ponen UTMs en los enlaces internos de la tienda ni en WhatsApp: pisarían la fuente real.
- Para publicaciones orgánicas o enlaces en la biografía se puede usar `utm_source=instagram` (o `tiktok`, `facebook`), `utm_medium=organic` y `utm_campaign` con un nombre corto en minúsculas y sin espacios (por ejemplo `dia-madre`).
- El panel toma el **último toque**: si alguien llegó por un anuncio y compró días después por un enlace directo, la venta cuenta para el último enlace con campaña que usó.

## Cómo comprobarlo

Abre la tienda con `https://jardindesele.com/?utm_source=meta&utm_medium=paid&utm_campaign=prueba&utm_content=AD-1&fbclid=test`, haz un pedido de prueba y en `/admin/pedidos` ábrelo: en «Origen» deben aparecer `meta / paid`, campaña `prueba` y anuncio `AD-1`. También puedes filtrar por campaña o anuncio.
