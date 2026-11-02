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
                path: 'catalogo/todos-productos/personalizador',
                loadComponent: () =>
                    import('./personalizador/presentacion/paginas/personalizador/personalizador')
                        .then(m => m.Personalizador)
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
            {
                path: 'catalogo/todos-productos/:producto',
                loadComponent: () =>
                    import('./detalle-producto/presentacion/paginas/detalle-producto/detalle-producto')
                        .then(m => m.DetalleProducto)
            }



        ]
    }


];