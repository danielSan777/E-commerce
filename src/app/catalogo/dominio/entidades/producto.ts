

interface Producto {
    id: number;
    nombre: string;
    imagen: string;          // ruta de la imagen
    precio: number;
    precioAnterior?: number; // opcional: se muestra tachado
    descuento?: number;      // opcional: porcentaje que se muestra en la etiqueta roja (ej. 10 → "-10%")
}
