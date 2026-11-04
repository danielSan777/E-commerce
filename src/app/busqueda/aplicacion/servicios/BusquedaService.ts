import { Injectable, inject } from '@angular/core';
import { CategoriaService } from '../../../categorias/aplicacion/servicios/CategoriaService';
import { ProductoCategoria } from '../../../categorias/dominio/interfaces/categoria';
import { coincide } from '../../dominio/normalizar';

// Búsqueda instantánea sobre el índice pequeño de productos. Hoy corre en el navegador sobre datos de prueba;
// con backend el índice lo entrega Laravel y el registro de búsquedas lo hace el servidor (Pasos 19 y 20).
@Injectable({ providedIn: 'root' })
export class BusquedaService {
    private categorias = inject(CategoriaService);
    private indice = this.categorias.indice();

    buscar(termino: string): ProductoCategoria[] {
        return this.indice.filter(e => coincide(termino, e.textos)).map(e => e.producto);
    }

    favoritos(): ProductoCategoria[] {
        return this.categorias.favoritos();
    }
}
