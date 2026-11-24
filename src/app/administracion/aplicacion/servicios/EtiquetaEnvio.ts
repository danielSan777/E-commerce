import { PedidoAdmin } from '../../dominio/interfaces/pedidos-admin';

/** Medidas de la etiqueta: 15 × 10 cm a 200 puntos por pulgada (nítida al imprimir y fácil de pegar en una caja). */
export const ETIQUETA_ANCHO_PX = 1181;
export const ETIQUETA_ALTO_PX = 787;
const PUNTOS_ANCHO = 425.2;   // 15 cm en puntos de PDF (1 pt = 1/72 pulgada)
const PUNTOS_ALTO = 283.5;    // 10 cm

export interface DatosEtiqueta {
    numero: string;
    destinatario: string;
    documento: string;
    celular: string;
    correo: string;
    provincia: string;
    canton: string;
    direccion: string;
    referencia: string;
    entrega: string;
    guia: string;
}

/** Lo que va impreso: los datos de quien recibe (el envío del pedido), no los de quien compró. */
export function datosDeEtiqueta(p: PedidoAdmin, entrega: string): DatosEtiqueta {
    const e = p.shipping;
    return {
        numero: p.number,
        destinatario: e.name,
        documento: e.id_number,
        celular: e.phone,
        correo: e.email || p.customer.email,
        provincia: e.province_name ?? '',
        canton: e.canton_name ?? '',
        direccion: e.address,
        referencia: e.reference ?? '',
        entrega,
        guia: p.tracking_number ?? '',
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

/** Dibuja la etiqueta en un canvas ya dimensionado a ETIQUETA_ANCHO_PX × ETIQUETA_ALTO_PX. */
export function dibujarEtiqueta(ctx: CanvasRenderingContext2D, d: DatosEtiqueta): void {
    const W = ETIQUETA_ANCHO_PX;
    const H = ETIQUETA_ALTO_PX;
    const margen = 56;
    const util = W - margen * 2;
    const fuente = (px: number, peso: 'normal' | 'bold' = 'normal') => { ctx.font = `${peso} ${px}px Arial, Helvetica, sans-serif`; };
    const medir = (t: string) => ctx.measureText(t).width;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, W - 24, H - 24);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#111111';

    // Encabezado: tienda y número de pedido
    fuente(34, 'bold');
    ctx.fillText('Jardín de Sele', margen, 86);
    ctx.textAlign = 'right';
    fuente(44, 'bold');
    ctx.fillText(`Pedido ${d.numero}`, W - margen, 86);
    ctx.textAlign = 'left';
    ctx.fillRect(margen, 108, util, 4);

    // Destinatario
    let y = 176;
    fuente(26, 'bold');
    ctx.fillText('PARA', margen, y);
    y += 62;
    fuente(58, 'bold');
    for (const l of partirEnLineas(d.destinatario, util, medir, 2)) { ctx.fillText(l, margen, y); y += 64; }

    fuente(46, 'bold');
    ctx.fillText(`Celular: ${d.celular}`, margen, y + 4);
    y += 58;
    if (d.documento) { fuente(32); ctx.fillText(`Cédula / RUC: ${d.documento}`, margen, y); y += 48; }

    fuente(42, 'bold');
    ctx.fillText([d.canton, d.provincia].filter(Boolean).join(', '), margen, y);
    y += 52;
    fuente(36);
    for (const l of partirEnLineas(d.direccion, util, medir, 2)) { ctx.fillText(l, margen, y); y += 44; }
    if (d.referencia) {
        fuente(32);
        for (const l of partirEnLineas(`Ref.: ${d.referencia}`, util, medir, 2)) { ctx.fillText(l, margen, y); y += 40; }
    }

    // Pie: correo, entrega y guía
    fuente(30);
    ctx.fillText(d.correo, margen, H - 92);
    const pie = [d.entrega ? `Entrega: ${d.entrega}` : '', d.guia ? `Guía: ${d.guia}` : ''].filter(Boolean).join('   ·   ');
    if (pie) { fuente(28, 'bold'); ctx.fillText(pie, margen, H - 50); }
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

function lienzo(d: DatosEtiqueta): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = ETIQUETA_ANCHO_PX;
    c.height = ETIQUETA_ALTO_PX;
    dibujarEtiqueta(c.getContext('2d')!, d);
    return c;
}

/** Descarga la etiqueta como imagen PNG (`etiqueta-JDS-1017.png`). */
export function descargarEtiquetaImagen(d: DatosEtiqueta): void {
    lienzo(d).toBlob(b => { if (b) descargar(b, `etiqueta-${d.numero}.png`); }, 'image/png');
}

/** Descarga la etiqueta como PDF de 15 × 10 cm (`etiqueta-JDS-1017.pdf`). */
export function descargarEtiquetaPdf(d: DatosEtiqueta): void {
    lienzo(d).toBlob(async b => {
        if (!b) return;
        const jpeg = new Uint8Array(await b.arrayBuffer());
        descargar(new Blob([construirPdf(jpeg, ETIQUETA_ANCHO_PX, ETIQUETA_ALTO_PX).buffer as ArrayBuffer], { type: 'application/pdf' }), `etiqueta-${d.numero}.pdf`);
    }, 'image/jpeg', 0.95);
}
