import { Routes } from '@angular/router';
import { MainLayout } from './core/layout/main-layout/main-layout/main-layout';

export const routes: Routes = [

    // Checkout: pantalla completa con su propio encabezado (va antes del MainLayout para que no lleve el navbar de la tienda)
    {
        path: 'checkout',
        pathMatch: 'full',
        loadComponent: () =>
            import('./checkout/presentacion/paginas/envio-facturacion/envio-facturacion')
                .then(m => m.EnvioFacturacion)
    },

    {
        path: '',
        component: MainLayout,
        children: [
            {
                path: '',
                redirectTo: 'catalogo',
                pathMatch: 'full'
            },
            {
                path: 'catalogo/todos-productos',
                loadComponent: () =>
                    import('./all-productos/presentacion/paginas/all-productos/all-productos')
                        .then(m => m.AllProductos)
            },
            {
                path: 'catalogo',
                loadComponent: () =>
                    import('./catalogo/presentacion/paginas/catalogo/catalogo')
                        .then(m => m.Catalogo)
            },
            {
                path: 'checkout/confirmacion',
                loadComponent: () =>
                    import('./checkout/presentacion/paginas/confirmacion/confirmacion')
                        .then(m => m.Confirmacion)
            },
            {
                path: 'checkout/pago',
                loadComponent: () =>
                    import('./checkout/presentacion/paginas/pago/pago')
                        .then(m => m.Pago)
            },
            { path: 'carrito', loadComponent: () => import('./carrito/presentacion/paginas/carrito/carrito').then(m => m.Carrito) },
            {
                path: 'catalogo/:slug',
                loadComponent: () =>
                    import('./catalogo/presentacion/paginas/catalogo/catalogo')
                        .then(m => m.Catalogo)
            },
            // Ficha de producto. El personalizador es su ruta hija: /producto/{slug}/personalizar
            // (la ficha sigue en pantalla; el personalizador sube encima).
            {
                path: 'producto/:producto',
                loadComponent: () =>
                    import('./detalle-producto/presentacion/paginas/detalle-producto/detalle-producto')
                        .then(m => m.DetalleProducto),
                children: [{ path: 'personalizar', children: [] }]
            },

            // Dirección anterior de la ficha
            { path: 'catalogo/todos-productos/:producto', redirectTo: ({ params }) => `/producto/${params['producto']}` },

            // Enlace privado con token: seguimiento si está pagado, pedido pendiente si es una transferencia sin pagar
            {
                path: 'pedido/:token',
                loadComponent: () =>
                    import('./checkout/presentacion/paginas/pedido-token/pedido-token')
                        .then(m => m.PedidoToken)
            },

            // Cualquier otra dirección: 404 propio (con estado HTTP 404 en el servidor)
            {
                path: '**',
                loadComponent: () =>
                    import('./core/paginas/no-encontrada/no-encontrada')
                        .then(m => m.NoEncontrada)
            }
        ]
    }


];