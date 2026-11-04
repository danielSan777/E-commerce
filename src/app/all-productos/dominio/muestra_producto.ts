export interface Producto {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    precioAnterior?: number;
    imagen: string;
    imagenes?: string[];   // fotos extra de la galería (miniaturas); si no hay, solo `imagen`
    tipo: string;
    coleccion: string;
    disponible: boolean;
    fecha: string; // AAAA-MM-DD
    vendidos: number;
    relevancia: number;
    slug: string;
}

export const productos: Producto[] = [
    {
        id: 1,
        nombre: 'Amigo guitarrista',
        slug: 'amigo-guitarrista',
        descripcion: 'Ideal para amigos, músicos, guitarristas o quienes disfrutan la música. Un regalo de amistad, cariño o cumpleaños.',
        precio: 20,
        imagen: 'imagenes/amor-amistad/Amigo-guitarrista.png',
        tipo: 'amor-amistad',
        coleccion: 'Dragon Ball',
        disponible: true,
        fecha: '2026-03-10',
        vendidos: 120,
        relevancia: 9
    },
    {
        id: 2,
        nombre: 'Bob corazón Hombre',
        slug: 'bob-corazon-hombre',
        descripcion: 'Ideal para hombres, novios, esposos o detalles de pareja. Un regalo de amor.',
        precio: 20,
        imagen: 'imagenes/amor-amistad/Bob corazón Hombre.png',
        tipo: 'amor-amistad',
        coleccion: 'Dragon Ball',
        disponible: true,
        fecha: '2026-04-02',
        vendidos: 98,
        relevancia: 8
    },
    {
        id: 3,
        nombre: 'Baby Garfield',
        slug: 'baby-garfield',
        descripcion: 'Para fans de Garfield: un personaje tierno, divertido y amante de los gatos.',
        precio: 22,
        imagen: 'imagenes/colecciones/personajes/baby.png',
        tipo: 'personaje',
        coleccion: 'Parejas',
        disponible: true,
        fecha: '2025-12-01',
        vendidos: 76,
        relevancia: 10
    },
    {
        id: 4,
        nombre: 'Bellota Chicas super poderosas',
        slug: 'bellota-chicas-super-poderosas',
        descripcion: 'Para fans de Las Chicas Superpoderosas: un personaje fuerte, valiente y de carácter.',
        precio: 20,
        imagen: 'imagenes/colecciones/personajes/bellota.png',
        tipo: 'ALARMA',
        coleccion: 'Deportes',
        disponible: false,
        fecha: '2026-01-15',
        vendidos: 54,
        relevancia: 6
    },
    {
        id: 5,
        nombre: 'Abogada',
        slug: 'abogada',
        descripcion: '',
        precio: 21,
        imagen: 'imagenes/profesionales/abogada.png',
        tipo: 'profesionales',
        coleccion: 'Parejas',
        disponible: true,
        fecha: '2026-05-20',
        vendidos: 33,
        relevancia: 7
    },
    {
        id: 6,
        nombre: 'Abogado',
        slug: 'abogado',
        descripcion: '',
        precio: 21,
        imagen: 'imagenes/profesionales/abogado.png',
        tipo: 'profesionales',
        coleccion: 'Dragon Ball',
        disponible: true,
        fecha: '2026-06-11',
        vendidos: 41,
        relevancia: 5
    },
    {
        id: 7,
        nombre: 'Doctor',
        slug: 'doctor',
        descripcion: '',
        precio: 21,
        imagen: 'imagenes/profesionales/doctor.png',
        tipo: 'profesionales',
        coleccion: 'Graduación',
        disponible: true,
        fecha: '2025-10-05',
        vendidos: 88,
        relevancia: 8
    },
    {
        id: 8,
        nombre: 'Homero',
        slug: 'homero',
        descripcion: 'Para fans de Los Simpson, las series animadas y los personajes cómicos y nostálgicos.',
        precio: 22,
        imagen: 'imagenes/colecciones/personajes/homero.png',
        tipo: 'cuadro',
        coleccion: 'Familia',
        disponible: true,
        fecha: '2026-02-18',
        vendidos: 22,
        relevancia: 4
    },
    {
        id: 9,
        nombre: 'Lucas con pantalón, personalizado',
        slug: 'lucas-con-pantalon-personalizado',
        descripcion: '',
        precio: 22,
        imagen: 'imagenes/colecciones/personajes/lucas.png',
        tipo: 'personaje',
        coleccion: 'Anime',
        disponible: false,
        fecha: '2025-11-23',
        vendidos: 65,
        relevancia: 6
    },
    {
        id: 10,
        nombre: 'enfermera',
        slug: 'enfermera',
        descripcion: '',
        precio: 21,
        imagen: 'imagenes/maceta2.png',
        tipo: 'profesionales',
        coleccion: 'Graduación',
        disponible: true,
        fecha: '2025-10-05',
        vendidos: 88,
        relevancia: 8
    }
];