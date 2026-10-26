import { Routes } from '@angular/router';
import { MainLayout } from './core/layout/main-layout/main-layout/main-layout';

export const routes: Routes = [

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
