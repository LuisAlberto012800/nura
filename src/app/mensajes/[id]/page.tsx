import { notFound } from "next/navigation";
import { Encabezado } from "@/components/Encabezado";
import { Hilo, type Mensaje } from "@/components/Hilo";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoBarberia } from "@/lib/sesion";

export const metadata = { title: "Conversación · Nura" };
export const dynamic = "force-dynamic";

export default async function Conversacion({ params }: { params: Promise<{ id: string }> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { id } = await params;
  const { supabase, salon } = await contextoBarberia();
  const [{ data: conv }, { data: mensajes }] = await Promise.all([
    supabase.from("conversaciones").select("id, nombre").eq("id", id).eq("salon_id", salon.id).maybeSingle(),
    supabase.from("mensajes").select("id, autor, texto, creado_en").eq("conversacion_id", id).order("creado_en").limit(200),
  ]);
  if (!conv) notFound();
  return (
    <main className="pantalla">
      <div className="contenido" style={{ gap: 12 }}>
        <Encabezado titulo={conv.nombre} volver="/mensajes" />
        <Hilo conversacionId={conv.id} salonId={salon.id} yo="salon" iniciales={(mensajes ?? []) as Mensaje[]} puedeEscribir />
      </div>
    </main>
  );
}
