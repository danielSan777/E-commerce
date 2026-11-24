import { REMITENTE } from '../../../core/configuracion/tienda';
import { PedidoAdmin } from '../../dominio/interfaces/pedidos-admin';

/** Medidas de la etiqueta: 15 × 10 cm a 200 puntos por pulgada (nítida al imprimir y fácil de pegar en una caja). */
export const ETIQUETA_ANCHO_PX = 1181;
export const ETIQUETA_ALTO_PX = 787;
const PUNTOS_ANCHO = 425.2;   // 15 cm en puntos de PDF (1 pt = 1/72 pulgada)
const PUNTOS_ALTO = 283.5;    // 10 cm

export interface DatosEtiqueta {
    numero: string;
    destino: string;      // «Balao – Prov. del Guayas»
    nombre: string;
    direccion: string;
    celular: string;      // siempre con 0 inicial: 0969632650
    documento: string;    // cédula o RUC de quien recibe
    referencia: string;
}

const PROVINCIAS_CON_EL = new Set(['Azuay', 'Carchi', 'Guayas', 'Napo']);

/** «Prov. del Guayas», «Prov. de Manabí»: con el artículo que corresponde. */
export function provinciaConArticulo(provincia: string): string {
    return provincia ? `Prov. ${PROVINCIAS_CON_EL.has(provincia) ? 'del' : 'de'} ${provincia}` : '';
}

/** El celular ecuatoriano se escribe con 0 inicial (09…), no con +593: «+593 969632650» → «0969632650». */
export function celularEcuatoriano(numero: string): string {
    const digitos = numero.replace(/\D/g, '');
    if (digitos.startsWith('593') && digitos.length >= 12) return `0${digitos.slice(3)}`;
    if (digitos.length === 9 && digitos.startsWith('9')) return `0${digitos}`;
    return numero.trim();
}

/** Lo que va impreso: los datos de quien recibe (el envío del pedido), no los de quien compró. */
export function datosDeEtiqueta(p: PedidoAdmin): DatosEtiqueta {
    const e = p.shipping;
    return {
        numero: p.number,
        destino: [e.canton_name, provinciaConArticulo(e.province_name ?? '')].filter(Boolean).join(' – '),
        nombre: e.name,
        direccion: e.address,
        celular: celularEcuatoriano(e.phone),
        documento: e.id_number,
        referencia: e.reference ?? '',
    };
}

/** Parte un texto en renglones que quepan en `ancho`; si pasa de `maxLineas`, el último termina en «…». */
export function partirEnLineas(texto: string, ancho: number, medir: (t: string) => number, maxLineas: number): string[] {
    const palabras = texto.split(/\s+/).filter(Boolean);
    const lineas: string[] = [];
    let actual = '';
    for (const palabra of palabras) {
        const prueba = actual ? `${actual} ${palabra}` : palabra;
        if (medir(prueba) <= ancho || !actual) actual = prueba;
        else { lineas.push(actual); actual = palabra; }
    }
    if (actual) lineas.push(actual);
    if (lineas.length <= maxLineas) return lineas;
    const recortadas = lineas.slice(0, maxLineas);
    let ultima = recortadas[maxLineas - 1];
    while (ultima.length > 1 && medir(`${ultima}…`) > ancho) ultima = ultima.slice(0, -1);
    recortadas[maxLineas - 1] = `${ultima}…`;
    return recortadas;
}

// Iconos de 24 × 24 (trazos SVG) para cada fila de la etiqueta
const ICONOS = {
    destino: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z',
    nombre: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    direccion: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    celular: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
    documento: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM9 7a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm4 10H5v-1c0-1.33 2.67-2 4-2s4 .67 4 2v1zm6-2h-4v-1.5h4V15zm0-3h-4v-1.5h4V12z',
    referencia: 'M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z',
} as const;

/** Dibuja la etiqueta en un canvas ya dimensionado a ETIQUETA_ANCHO_PX × ETIQUETA_ALTO_PX. `logo` es opcional. */
export function dibujarEtiqueta(ctx: CanvasRenderingContext2D, d: DatosEtiqueta, logo?: CanvasImageSource | null): void {
    const W = ETIQUETA_ANCHO_PX;
    const H = ETIQUETA_ALTO_PX;
    const margen = 70;
    const fuente = (px: number, peso: 'normal' | 'bold' = 'normal') => { ctx.font = `${peso} ${px}px Arial, Helvetica, sans-serif`; };
    const medir = (t: string) => ctx.measureText(t).width;
    const linea = (y: number, grosor: number, color = '#222222') => { ctx.fillStyle = color; ctx.fillRect(margen - 16, y, W - (margen - 16) * 2, grosor); };
    const etiqueta = (texto: string, y: number) => {
        fuente(34, 'bold');
        const ancho = medir(texto) + 40;
        ctx.fillStyle = '#e4e4e4';
        ctx.beginPath();
        ctx.roundRect(margen - 12, y, ancho, 52, 10);
        ctx.fill();
        ctx.fillStyle = '#111111';
        ctx.fillText(texto, margen + 8, y + 38);
    };

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 7;
    ctx.strokeRect(10, 10, W - 20, H - 20);
    ctx.lineWidth = 5;
    ctx.strokeRect(26, 26, W - 52, H - 52);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#111111';

    // Encabezado: logo, tienda y número de pedido
    if (logo) ctx.drawImage(logo, margen - 4, 46, 84, 84);
    fuente(54, 'bold');
    ctx.fillText('Jardín de Sele', margen + 96, 104);
    fuente(56, 'bold');
    const pedido = `Pedido ${d.numero}`;
    ctx.textAlign = 'right';
    ctx.fillText(pedido, W - margen, 104);
    ctx.textAlign = 'left';
    ctx.fillRect(W - margen - medir(pedido) - 34, 56, 4, 64);
    linea(146, 4);

    // Remitente
    etiqueta('REMITENTE:', 164);
    fuente(44, 'bold');
    ctx.fillText(REMITENTE.nombre, margen, 276);
    fuente(32);
    ctx.fillText(`RUC: ${REMITENTE.ruc}`, margen, 318);
    linea(344, 3, '#555555');

    // Destinatario: una fila por dato; si algo no cabe, todo se achica parejo
    etiqueta('DESTINATARIO:', 360);
    const filas: { icono: keyof typeof ICONOS; rotulo: string; texto: string }[] = [
        { icono: 'destino', rotulo: 'Destino', texto: d.destino },
        { icono: 'nombre', rotulo: 'Nombre', texto: d.nombre },
        { icono: 'direccion', rotulo: 'Dirección', texto: d.direccion },
        { icono: 'celular', rotulo: 'Celular', texto: d.celular },
        { icono: 'documento', rotulo: 'Cédula / RUC', texto: d.documento },
        ...(d.referencia ? [{ icono: 'referencia' as const, rotulo: 'Referencia', texto: d.referencia }] : []),
    ];
    const xRotulo = margen + 52;
    const xDosPuntos = margen + 330;
    const xValor = xDosPuntos + 32;
    const anchoValor = W - margen - xValor;
    const disponible = H - 40 - 428;
    let escala = 1;
    let bloques: { lineas: string[]; alto: number }[] = [];
    for (let intento = 0; intento < 6; intento++) {
        fuente(Math.round(34 * escala));
        bloques = filas.map(f => { const lineas = partirEnLineas(f.texto, anchoValor, medir, 2); return { lineas, alto: Math.round(((lineas.length - 1) * 38 + 56) * escala) }; });
        if (bloques.reduce((t, b) => t + b.alto, 0) <= disponible) break;
        escala -= 0.08;
    }
    let y = 428;
    filas.forEach((f, i) => {
        const b = bloques[i];
        const base = y + Math.round(40 * escala);
        ctx.fillStyle = '#111111';
        ctx.save();
        ctx.translate(margen, base - Math.round(30 * escala));
        ctx.scale((30 * escala) / 24, (30 * escala) / 24);
        ctx.fill(new Path2D(ICONOS[f.icono]), 'evenodd');
        ctx.restore();
        fuente(Math.round(34 * escala), 'bold');
        ctx.fillText(f.rotulo, xRotulo, base);
        ctx.fillText(':', xDosPuntos, base);
        fuente(Math.round(34 * escala));
        b.lineas.forEach((l, k) => ctx.fillText(l, xValor, base + k * Math.round(38 * escala)));
        y += b.alto;
        if (i < filas.length - 1) linea(y - 8, 2, '#bdbdbd');
    });
}

/** Arma un PDF de una sola página (15 × 10 cm) con la imagen JPEG a página completa. Sin librerías externas. */
export function construirPdf(jpeg: Uint8Array, anchoPx: number, altoPx: number): Uint8Array {
    const texto = new TextEncoder();
    const partes: Uint8Array[] = [];
    const offsets: number[] = [];
    let largo = 0;
    const agregar = (p: Uint8Array | string) => {
        const b = typeof p === 'string' ? texto.encode(p) : p;
        partes.push(b);
        largo += b.length;
    };
    const objeto = (n: number, cuerpo: (Uint8Array | string)[]) => {
        offsets[n] = largo;
        agregar(`${n} 0 obj\n`);
        cuerpo.forEach(agregar);
        agregar('\nendobj\n');
    };

    agregar('%PDF-1.4\n');
    objeto(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
    objeto(2, ['<< /Type /Pages /Kids [3 0 R] /Count 1 >>']);
    objeto(3, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PUNTOS_ANCHO} ${PUNTOS_ALTO}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`]);
    const contenido = `q ${PUNTOS_ANCHO} 0 0 ${PUNTOS_ALTO} 0 0 cm /Im0 Do Q`;
    objeto(4, [`<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`]);
    objeto(5, [`<< /Type /XObject /Subtype /Image /Width ${anchoPx} /Height ${altoPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`, jpeg, '\nendstream']);

    const inicioXref = largo;
    agregar('xref\n0 6\n0000000000 65535 f \n');
    for (let n = 1; n <= 5; n++) agregar(`${String(offsets[n]).padStart(10, '0')} 00000 n \n`);
    agregar(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`);

    const salida = new Uint8Array(largo);
    let pos = 0;
    for (const p of partes) { salida.set(p, pos); pos += p.length; }
    return salida;
}

function descargar(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** El logo de la tienda; si no se puede cargar, la etiqueta sale sin él. */
function cargarLogo(): Promise<HTMLImageElement | null> {
    return new Promise(resolver => {
        const img = new Image();
        img.onload = () => resolver(img);
        img.onerror = () => resolver(null);
        img.src = '/logo_sin_fondo.png';
    });
}

async function lienzo(d: DatosEtiqueta): Promise<HTMLCanvasElement> {
    const c = document.createElement('canvas');
    c.width = ETIQUETA_ANCHO_PX;
    c.height = ETIQUETA_ALTO_PX;
    dibujarEtiqueta(c.getContext('2d')!, d, await cargarLogo());
    return c;
}

/** Descarga la etiqueta como imagen PNG (`etiqueta-JDS-1017.png`). */
export async function descargarEtiquetaImagen(d: DatosEtiqueta): Promise<void> {
    (await lienzo(d)).toBlob(b => { if (b) descargar(b, `etiqueta-${d.numero}.png`); }, 'image/png');
}

/** Descarga la etiqueta como PDF de 15 × 10 cm (`etiqueta-JDS-1017.pdf`). */
export async function descargarEtiquetaPdf(d: DatosEtiqueta): Promise<void> {
    (await lienzo(d)).toBlob(async b => {
        if (!b) return;
        const jpeg = new Uint8Array(await b.arrayBuffer());
        descargar(new Blob([construirPdf(jpeg, ETIQUETA_ANCHO_PX, ETIQUETA_ALTO_PX).buffer as ArrayBuffer], { type: 'application/pdf' }), `etiqueta-${d.numero}.pdf`);
    }, 'image/jpeg', 0.95);
}
