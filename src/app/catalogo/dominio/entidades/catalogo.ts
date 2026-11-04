export interface CatalogoMenu {
    id: number;
    nombre: string;
    slug: string;
    icono: string;
    ruta?: string;   // dirección a la que lleva (si falta, lleva a la pantalla principal)
}

