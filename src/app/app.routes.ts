import { Routes } from '@angular/router';
import { adminGuard, sesionGuard } from './administracion/aplicacion/adminAuth';
import { MainLayout } from './core/layout/main-layout/main-layout/main-layout';

const pantallaCategorias = () =>
    import('./categorias/presentacion/paginas/categorias/categorias').then(m => m.Categorias);

// Catálogos del menú anterior → su categoría
const CATALOGO_A_CATEGORIA: Record<string, string> = {
    macetas: '/amor',
    profesionales: '/profesiones-y-hobbies',
    personajes: '/amistad',
};

export const routes: Routes = [

    // Panel del administrador (Angular consume /api/v1/admin/*). Pantalla completa, sin el navbar de la tienda.
    // El ingreso es uno solo (/ingresar): la API dice el rol y de ahí se decide a dónde ir.
    { path: 'admin/login', redirectTo: '/ingresar', pathMatch: 'full' },
    {
        path: 'admin/productos/nuevo',
        canActivate: [adminGuard],
        loadComponent: () => import('./administracion/presentacion/paginas/producto-form/producto-form').then(m => m.AdminProductoForm)
    },
    {
        path: 'admin/productos/:sku',
        canActivate: [adminGuard],
        loadComponent: () => import('./administracion/presentacion/paginas/producto-form/producto-form').then(m => m.AdminProductoForm)
    },
    {
        path: 'admin/productos',
        canActivate: [adminGuard],
        loadComponent: () => import('./administracion/presentacion/paginas/productos/productos').then(m => m.AdminProductos)
    },
    {
        path: 'admin/campanas',
        canActivate: [adminGuard],
        loadComponent: () => import('./administracion/presentacion/paginas/campanas/campanas').then(m => m.AdminCampanas)
    },
    {
        path: 'admin/categorias/:slug/imagenes',
        canActivate: [adminGuard],
        loadComponent: () => import('./administracion/presentacion/paginas/imagenes-categoria/imagenes-categoria').then(m => m.AdminImagenesCategoria)
    },
    {
        path: 'admin/categorias/:slug/subcategorias',
        canActivate: [adminGuard],
        loadComponent: () => import('./administracion/presentacion/paginas/subcategorias/subcategorias').then(m => m.AdminSubcategorias)
    },
    {
        path: 'admin/categorias',
        canActivate: [adminGuard],
        loadComponent: () => import('./administracion/presentacion/paginas/categorias/categorias').then(m => m.AdminCategorias)
    },
    {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./administracion/presentacion/paginas/panel/panel').then(m => m.AdminPanel)
    },

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
            // Cuentas de clientes y administradores
            { path: 'ingresar', loadComponent: () => import('./cuenta/presentacion/paginas/ingresar/ingresar').then(m => m.Ingresar) },
            { path: 'crear-cuenta', loadComponent: () => import('./cuenta/presentacion/paginas/crear-cuenta/crear-cuenta').then(m => m.CrearCuenta) },
            { path: 'mi-cuenta', canActivate: [sesionGuard], loadComponent: () => import('./cuenta/presentacion/paginas/mi-cuenta/mi-cuenta').then(m => m.MiCuenta) },

            // Página principal
            {
                path: '',
                pathMatch: 'full',
                loadComponent: () =>
                    import('./inicio/presentacion/paginas/inicio/inicio').then(m => m.Inicio)
            },
            { path: 'buscar', loadComponent: () => import('./busqueda/presentacion/paginas/buscar/buscar').then(m => m.Buscar) },

            // Pantalla de categorías: reemplaza a "Todos los productos"
            { path: 'categorias', loadComponent: () => import('./categorias/presentacion/paginas/categorias-inicio/categorias-inicio').then(m => m.CategoriasInicio) },
            { path: 'consultar-pedido', loadComponent: () => import('./checkout/presentacion/paginas/consultar-pedido/consultar-pedido').then(m => m.ConsultarPedido) },
            { path: 'terminos-y-condiciones', loadComponent: () => import('./politicas/presentacion/paginas/politica/politica').then(m => m.Politica) },
            // Campaña de temporada (la URL no lleva año; fuera de temporada sigue respondiendo)
            { path: 'san-valentin', data: { campana: 'san-valentin' }, loadComponent: () => import('./campanas/presentacion/paginas/campana/campana').then(m => m.Campana) },
            { path: 'catalogo/todos-productos', redirectTo: '/categorias', pathMatch: 'full' },
            // Direcciones anteriores de la pantalla principal y de sus catálogos
            { path: 'catalogo', redirectTo: '/', pathMatch: 'full' },
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
            { path: 'catalogo/:slug', redirectTo: ({ params }) => CATALOGO_A_CATEGORIA[params['slug']] ?? '/categorias' },
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

            // Categorías y subcategorías (/amor, /profesiones-y-hobbies/salud…). La lista sale de la base de datos: una categoría
            // creada en el panel tiene su dirección sin tocar código. Va después de todas las rutas fijas; si Laravel dice que
            // no existe, la pantalla muestra el 404.
            { path: ':categoria', loadComponent: pantallaCategorias },
            { path: ':categoria/:subcategoria', loadComponent: pantallaCategorias },

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