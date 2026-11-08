import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { CategoriaService } from '../../../categorias/aplicacion/servicios/CategoriaService';
import { ProductoCategoria } from '../../../categorias/dominio/interfaces/categoria';
import { coincide } from '../../dominio/normalizar';

// Búsqueda instantánea sobre el índice pequeño de productos que entrega Laravel (nombre, palabras de búsqueda, categoría y
// subcategoría). Se descarga una sola vez y se filtra en el navegador mientras se escribe. El registro de búsquedas
// lo hará el servidor (Pasos 19 y 20).
@Injectable({ providedIn: 'root' })
export class BusquedaService {
    private categorias = inject(CategoriaService);
    private indice = toSignal(this.categorias.indice().pipe(catchError(() => of([]))), { initialValue: [] });
    private _favoritos = toSignal(this.categorias.favoritos().pipe(catchError(() => of([]))), { initialValue: [] });

    /** Se lee dentro de un `computed`: cuando llega el índice, los resultados se vuelven a calcular solos. */
    buscar(termino: string): ProductoCategoria[] {
        return this.indice().filter(e => coincide(termino, e.textos)).map(e => e.producto);
    }

    favoritos(): ProductoCategoria[] {
        return this._favoritos();
    }
}
