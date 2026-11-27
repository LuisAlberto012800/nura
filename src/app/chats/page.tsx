import Link from "next/link";
import { redirect } from "next/navigation";
import { BarraClienta } from "@/components/BarraClienta";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { sesionActual } from "@/lib/sesion";

export const metadata = { title: "Mis mensajes · Nura" };
export const dynamic = "force-dynamic";

type Conv = { id: string; ultimo_texto: string | null; ultimo_autor: string | null; ultimo_mensaje_en: string | null; leido_cliente_en: string | null; salon: { nombre: string; slug: string } | null };

export default async function Chats() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { supabase, user } = await sesionActual();
  if (!user) redirect("/");
  const { data } = await supabase.from("conversaciones").select("id, ultimo_texto, ultimo_autor, ultimo_mensaje_en, leido_cliente_en, salon:salones(nombre, slug)").eq("usuario_id", user.id).order("ultimo_mensaje_en", { ascending: false });
  const lista = ((data ?? []) as unknown as Conv[]).filter((c) => c.salon);
  return (
    <main className="pantalla">
      <div className="contenido">
        <h1 className="titulo">Mis mensajes</h1>
        {lista.length === 0 ? (
          <p className="aviso aviso-neutro">Cuando le escribas a una barbería desde su página, la conversación aparece aquí.</p>
        ) : (
          <ul className="lista-servicios">
            {lista.map((c) => {
              const nuevo = c.ultimo_autor === "salon" && (!c.leido_cliente_en || (c.ultimo_mensaje_en ?? "") > c.leido_cliente_en);
              return (
                <li key={c.id}>
                  <Link href={`/chat/${c.salon!.slug}`} className="fila-cliente">
                    <span className="avatar avatar-sm">{c.salon!.nombre.charAt(0)}</span>
                    <span className="servicio-info">
                      <strong>{c.salon!.nombre}</strong>
                      <span className="meta" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: nuevo ? 700 : 400 }}>{c.ultimo_texto}</span>
                    </span>
                    {nuevo && <span className="punto-nuevo" aria-label="Sin leer" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <BarraClienta activa="tu" />
    </main>
  );
}
