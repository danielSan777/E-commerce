/**
 * Reduce una foto del navegador a un JPEG de hasta `maxLado` píxeles y menos de `maxBytes`, para mandarla con el pedido
 * (Laravel acepta hasta 2 MB). Devuelve un data URL. Rechaza si el archivo no es una imagen que el navegador pueda abrir.
 */
export async function reducirFoto(archivo: File, maxLado = 1600, maxBytes = 1_800_000): Promise<string> {
    const url = URL.createObjectURL(archivo);
    try {
        const img = await new Promise<HTMLImageElement>((ok, mal) => {
            const i = new Image();
            i.onload = () => ok(i);
            i.onerror = () => mal(new Error('No pudimos leer la foto del marco.'));
            i.src = url;
        });

        const escala = Math.min(1, maxLado / Math.max(img.naturalWidth, img.naturalHeight));
        const lienzo = document.createElement('canvas');
        lienzo.width = Math.max(1, Math.round(img.naturalWidth * escala));
        lienzo.height = Math.max(1, Math.round(img.naturalHeight * escala));
        const ctx = lienzo.getContext('2d');
        if (!ctx) throw new Error('No pudimos preparar la foto del marco.');
        ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);

        // Se baja la calidad hasta que quepa; el data URL pesa ~4/3 del archivo
        for (let calidad = 0.88; calidad >= 0.4; calidad -= 0.12) {
            const dataUrl = lienzo.toDataURL('image/jpeg', calidad);
            if (dataUrl.length * 0.75 <= maxBytes) return dataUrl;
        }
        throw new Error('La foto del marco pesa demasiado. Elige una más pequeña.');
    } finally {
        URL.revokeObjectURL(url);
    }
}
