"use client";

// Reduce la foto en el teléfono antes de subirla: lado mayor de 1600 px en JPG.
// Una foto de 4 MB queda en unos 300 KB, que cuida el espacio gratis de Supabase.
export async function reducirFoto(archivo: File, ladoMayor = 1600, calidad = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo, { imageOrientation: "from-image" }).catch(() => null);
  const fuente: CanvasImageSource & { width: number; height: number } =
    bitmap ?? (await cargarImagen(archivo));
  const escala = Math.min(1, ladoMayor / Math.max(fuente.width, fuente.height));
  const ancho = Math.round(fuente.width * escala);
  const alto = Math.round(fuente.height * escala);
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  lienzo.getContext("2d")!.drawImage(fuente, 0, 0, ancho, alto);
  bitmap?.close();
  return new Promise((resolver, rechazar) =>
    lienzo.toBlob((b) => (b ? resolver(b) : rechazar(new Error("No se pudo preparar la foto"))), "image/jpeg", calidad),
  );
}

function cargarImagen(archivo: File): Promise<HTMLImageElement> {
  return new Promise((resolver, rechazar) => {
    const img = new Image();
    img.onload = () => resolver(img);
    img.onerror = () => rechazar(new Error("No se pudo leer la foto"));
    img.src = URL.createObjectURL(archivo);
  });
}
