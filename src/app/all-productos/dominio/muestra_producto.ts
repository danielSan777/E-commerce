export interface Producto {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    precioAnterior?: number;
    imagen: string;
    tipo: string;
    coleccion: string;
    disponible: boolean;
    fecha: string; // AAAA-MM-DD
    vendidos: number;
    relevancia: number;
}

export const productos: Producto[] = [
    {
        id: 1, nombre: 'Amigo-guitarrista', descripcion: 'Ideal para: Amigos, músicos, guitarristas o personas que disfrutan la música' +
            'Contexto de recomendación: Cuando el cliente busca un regalo de amistad, cariño o cumpleaños para un hombre que toca guitarra o disfruta la música.', precio: 20, imagen: 'imagenes/amor-amistad/Amigo-guitarrista.png', tipo: 'amor-amistad', coleccion: 'Dragon Ball', disponible: true, fecha: '2026-03-10', vendidos: 120, relevancia: 9
    },
    {
        id: 2, nombre: 'Bob corazón Hombre', descripcion: 'Ideal para: Hombres, novios, esposos o personas en un contexto romántico' +
            'Contexto de recomendación: Cuando el cliente busca un regalo de amor para un hombre, novio, esposo o pareja masculina' +
            'Palabras relacionadas: Bob corazón hombre, hombre con corazón, amor, romántico, novio, esposo, detalle de pareja.', precio: 20, precioAnterior: 179, imagen: 'imagenes/amor-amistad/Bob corazón Hombre.png', tipo: 'amor-amistad', coleccion: 'Dragon Ball', disponible: true, fecha: '2026-04-02', vendidos: 98, relevancia: 8
    },
    { id: 3, nombre: 'Baby Garfield', descripcion: 'Para fans de Garfield o cuando el cliente busca un personaje tierno, divertido o relacionado con gatos.', precio: 22, imagen: 'imagenes/colecciones/personajes/baby.png', tipo: 'personaje', coleccion: 'Parejas', disponible: true, fecha: '2025-12-01', vendidos: 76, relevancia: 10 },
    { id: 4, nombre: 'Bellota Chicas super poderosas', descripcion: 'Para fans de Las Chicas Superpoderosas o cuando el cliente busca un personaje verde, fuerte, valiente y de carácter.', precio: 20, precioAnterior: 199, imagen: 'imagenes/colecciones/personajes/bellota.png', tipo: 'ALARMA', coleccion: 'Deportes', disponible: false, fecha: '2026-01-15', vendidos: 54, relevancia: 6 },

    {
        id: 5, nombre: 'Abogada', descripcion: '*Incluye ' +
            '🌿 Plantita natura' +
            '💌 Dedicatoria personalizada' +
            '🛍️ Funda kraft JDS' +
            '📄 Guía de cuidados' +
            '🪨 Piedritas de repuesto.', precio: 21, imagen: 'imagenes/profesionales/abogada.png', tipo: 'profesionales', coleccion: 'Parejas', disponible: true, fecha: '2026-05-20', vendidos: 33, relevancia: 7
    },
    {
        id: 6, nombre: 'Abogado', descripcion: '*Incluye:' +
            '🌿 Plantita natural' +
            '💌 Dedicatoria personalizada' +
            '🛍️ Funda kraft JDS' +
            '📄 Guía de cuidados' +
            '🪨 Piedritas de repuesto', precio: 21, imagen: 'imagenes/profesionales/abogado.png', tipo: 'profesionales', coleccion: 'Dragon Ball', disponible: true, fecha: '2026-06-11', vendidos: 41, relevancia: 5
    },
    {
        id: 7, nombre: 'Doctor', descripcion: '*Incluye:*' +
            '🌿 Plantita natural' +
            '💌 Dedicatoria personalizada' +
            '🛍️ Funda kraft JDS' +
            '📄 Guía de cuidados' +
            '🪨 Piedritas de repuesto.', precio: 21, imagen: 'imagenes/profesionales/doctor.png', tipo: 'profesionales', coleccion: 'Graduación', disponible: true, fecha: '2025-10-05', vendidos: 88, relevancia: 8
    },
    { id: 8, nombre: 'Homero', descripcion: 'Para fans de Los Simpson, series animadas o personajes cómicos, populares y nostálgicos..', precio: 22, imagen: 'imagenes/colecciones/personajes/homero.png', tipo: 'cuadro', coleccion: 'Familia', disponible: true, fecha: '2026-02-18', vendidos: 22, relevancia: 4 },
    {
        id: 9, nombre: 'Lucas con pantalón, personalizado', descripcion: '*Incluye:*' +
            '🌿 Plantita natural' +
            '💌 Dedicatoria' +
            '📄 Guía de cuidados' +
            '🤎 Tarjeta de agradecimiento' +
            '🎁 Funda kraft JDS incluida' +
            '🪨 Piedritas decorativas de repuesto.', precio: 22, imagen: 'imagenes/colecciones/personajes/lucas.png', tipo: 'personaje', coleccion: 'Anime', disponible: false, fecha: '2025-11-23', vendidos: 65, relevancia: 6
    },

];