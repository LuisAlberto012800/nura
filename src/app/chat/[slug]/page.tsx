import { notFound, redirect } from "next/navigation";
import { Encabezado } from "@/components/Encabezado";
import { Hilo, type Mensaje } from "@/components/Hilo";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { sesionActual } from "@/lib/sesion";
import { estadoChat, type AjustesChat } from "@/lib/chat";

export const metadata = { title: "Chat · Nura" };
export const dynamic = "force-dynamic";

// Chat de la clienta con una barbería.
export default async function Chat({ params }: { params: Promise<{ slug: string }> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { slug } = await params;
  const { supabase, user } = await sesionActual();
  if (!user) redirect("/entrar");
  const { data: salon } = await supabase.from("salones").select("id, nombre, slug, chat_hasta, chat_inicio, chat_fin, chat_dias").eq("slug", slug).maybeSingle();
  if (!salon) notFound();
  const chat = estadoChat(salon as AjustesChat);
  if (!chat.activo) redirect(`/b/${slug}`);
  const { data: conv } = await supabase.from("conversaciones").select("id").eq("salon_id", salon.id).eq("usuario_id", user.id).maybeSingle();
  const { data: mensajes } = conv ? await supabase.from("mensajes").select("id, autor, texto, creado_en").eq("conversacion_id", conv.id).order("creado_en").limit(200) : { data: [] };

  return (
    <main className="pantalla">
      <div className="contenido" style={{ gap: 12 }}>
        <Encabezado titulo={salon.nombre} volver={`/b/${slug}`} />
        <p className="meta" style={{ margin: 0, textAlign: "center" }}>
          {chat.abierto ? "Chat abierto" : "Chat cerrado"} · {chat.horario}
        </p>
        <Hilo
          conversacionId={conv?.id ?? null}
          salonId={salon.id}
          yo="cliente"
          iniciales={(mensajes ?? []) as Mensaje[]}
          puedeEscribir={chat.abierto}
          avisoCerrado={`El chat está cerrado. Abre ${chat.horario}. Puedes reservar en su página a cualquier hora.`}
        />
      </div>
    </main>
  );
}
