import { Injectable, computed, signal } from '@angular/core';
import { AccesorioColocado } from '../../../personalizador/dominio/Accesorios';

// Producto que se está personalizando (lo manda la pantalla del producto al personalizador)
export interface ProductoCarrito {
    id: number | string;
    nombre: string;
    precio: number;
    imagen?: string;
}

// Una línea del resumen del carrito: "Nombre: pendiente", "Accesorios: marco-foto, herramienta"...
export interface LineaResumen {
    icono: string;     // clase de Bootstrap Icons
    etiqueta: string;
    valor: string;
}

// Todo lo que hace falta para volver a abrir el personalizador con lo que el cliente eligió
export interface ConfigGuardada {
    accesorios: AccesorioColocado[];
    nombre: string;
    colorLentes: string;
    colorGafas: string;
    dedicatoria: string;
    textoMarco: string;
    sinTarjeta: boolean;
    fotoMarcoNombre: string;
}

export interface ItemCarrito {
    uid: string;
    tipo: 'personalizado' | 'complemento';
    producto: ProductoCarrito;
    vista: string;                 // foto de la maceta ya personalizada (data URL)
    ruta: string;                  // pantalla donde se personalizó (para el botón Editar)
    resumen: LineaResumen[];
    configuracion?: ConfigGuardada;
    igualConfirmada?: boolean;     // el comprador confirmó que quiere dos macetas idénticas
}

// Las fotos que subió el cliente no caben en localStorage: viven en memoria mientras no se recargue la página
export interface ArchivosItem {
    fotoMarco: File | null;
}

@Injectable({ providedIn: 'root' })
export class CarritoService {

    private readonly CLAVE = 'carrito-jardin-de-sele';

    private archivos = new Map<string, ArchivosItem>();

    readonly items = signal<ItemCarrito[]>(this.leer());

    readonly cantidad = computed(() => this.items().length);

    readonly subtotal = computed(() =>
        this.items().reduce((suma, item) => suma + (item.producto.precio || 0), 0)
    );

    // Agrega el item; si ya existe uno con el mismo uid (se estaba editando) lo reemplaza en su lugar
    guardar(item: ItemCarrito, archivos?: ArchivosItem): void {
        this.items.update(lista =>
            lista.some(i => i.uid === item.uid)
                ? lista.map(i => (i.uid === item.uid ? item : i))
                : [...lista, item]
        );

        if (archivos) this.archivos.set(item.uid, archivos);
        this.persistir();
    }

    quitar(uid: string): void {
        this.items.update(lista => lista.filter(i => i.uid !== uid));
        this.archivos.delete(uid);
        this.persistir();
    }

    buscar(uid: string): ItemCarrito | undefined {
        return this.items().find(i => i.uid === uid);
    }

    archivosDe(uid: string): ArchivosItem {
        return this.archivos.get(uid) ?? { fotoMarco: null };
    }

    vaciar(): void {
        this.items.set([]);
        this.archivos.clear();
        this.persistir();
    }

    // ----- localStorage (con cuidado: puede no existir o estar lleno) -----
    private leer(): ItemCarrito[] {
        try {
            if (typeof localStorage === 'undefined') return [];
            const guardado = JSON.parse(localStorage.getItem(this.CLAVE) ?? '[]');
            return Array.isArray(guardado) ? (guardado as ItemCarrito[]) : [];
        } catch {
            return [];
        }
    }

    private persistir(): void {
        try {
            if (typeof localStorage === 'undefined') return;
            localStorage.setItem(this.CLAVE, JSON.stringify(this.items()));
        } catch {
            // sin espacio o bloqueado: el carrito sigue funcionando mientras la página esté abierta
        }
    }
}