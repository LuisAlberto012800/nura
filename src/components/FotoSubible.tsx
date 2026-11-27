"use client";

import { useRef, useState, useTransition } from "react";
import { Icono } from "./Iconos";
import { reducirFoto } from "@/lib/imagen";
import { crearClienteNavegador } from "@/lib/supabase/navegador";
import { SUPABASE_URL } from "@/lib/supabase/config";

// Foto que se cambia con un toque: de perfil (círculo) o de portada (banda ancha).
// Se reduce en el teléfono, se sube a la carpeta del salón y se guarda.
export function FotoSubible({
  salonId,
  carpeta,
  actual,
  forma,
  inicial,
  guardar,
}: {
  salonId: string;
  carpeta: "perfil" | "portada";
  actual: string | null;
  forma: "circulo" | "portada";
  inicial?: string;
  guardar: (url: string | null) => Promise<{ error?: string }>;
}) {
  const [foto, setFoto] = useState(actual);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, iniciar] = useTransition();
  const entrada = useRef<HTMLInputElement>(null);

  const elegir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    setError(null);
    setSubiendo(true);
    try {
      const cuerpo = await reducirFoto(archivo, forma === "circulo" ? 600 : 1600);
      const ruta = `${salonId}/${carpeta}/${crypto.randomUUID()}.jpg`;
      const { error: errorSubida } = await crearClienteNavegador()
        .storage.from("trabajos")
        .upload(ruta, cuerpo, { contentType: "image/jpeg", cacheControl: "31536000" });
      if (errorSubida) throw errorSubida;
      const url = `${SUPABASE_URL}/storage/v1/object/public/trabajos/${ruta}`;
      const r = await guardar(url);
      if (r.error) throw new Error(r.error);
      setFoto(url);
      iniciar(() => {});
    } catch (x) {
      setError(x instanceof Error && x.message.length < 120 ? x.message : "No se pudo subir la foto. Revisa tu internet e intenta de nuevo.");
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className={`foto-subible ${forma}`}>
      <button type="button" className="foto-subible-boton" onClick={() => entrada.current?.click()} disabled={subiendo} aria-label={foto ? "Cambiar foto" : "Agregar foto"}>
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="" />
        ) : forma === "circulo" ? (
          <span className="inicial">{inicial ?? ""}</span>
        ) : (
          <span className="vacia">
            <Icono nombre="foto" tamano={26} />
            Agrega una portada
          </span>
        )}
        <span className="insignia-camara" aria-hidden="true">
          <Icono nombre="camara" tamano={16} />
        </span>
        {subiendo && <span className="cargando">Subiendo…</span>}
      </button>
      <input ref={entrada} type="file" accept="image/*" hidden onChange={elegir} />
      {error && <p className="aviso aviso-error" role="alert" style={{ margin: 0 }}>{error}</p>}
    </div>
  );
}
