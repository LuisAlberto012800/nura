import Link from "next/link";
import { BarraBarberia } from "@/components/BarraBarberia";
import { Complemento } from "@/components/Complemento";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoBarberia } from "@/lib/sesion";
import { estadoChat, type AjustesChat } from "@/lib/chat";
import { haceCuanto } from "@/lib/formato";
import { PRECIO_CHAT } from "@/lib/insights";
import { diaLocal, horaLocal, hoyLocal } from "@/lib/tiempo";
import { HorarioChat } from "./HorarioChat";

export const metadata = { title: "Mensajes · Nura" };
export const dynamic = "force-dynamic";

type Conversacion = { id: string; nombre: string; ultimo_texto: string | null; ultimo_autor: string | null; ultimo_mensaje_en: string | null; leido_salon_en: string | null };

export default async function Mensajes() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { supabase, salon } = await contextoBarberia();
  const { data: ajustes } = await supabase.from("salones").select("chat_hasta, chat_inicio, chat_fin, chat_dias").eq("id", salon.id).maybeSingle();
  const a = (ajustes ?? { chat_hasta: null, chat_inicio: "10:00", chat_fin: "19:00", chat_dias: [1, 2, 3, 4, 5, 6] }) as AjustesChat;
  const chat = estadoChat(a);
  const { data } = chat.activo
    ? await supabase.from("conversaciones").select("id, nombre, ultimo_texto, ultimo_autor, ultimo_mensaje_en, leido_salon_en").eq("salon_id", salon.id).order("ultimo_mensaje_en", { ascending: false, nullsFirst: false }).limit(100)
    : { data: [] };
  const conversaciones = (data ?? []) as Conversacion[];
  const hoy = hoyLocal();

  return (
    <main className="pantalla">
      <div className="contenido">
        <div>
          <h1 className="titulo">Mensajes</h1>
          <p className="subtitulo">
            {!chat.activo ? "Chat en vivo con tus clientes." : chat.abierto ? `Chat abierto ahora · ${chat.horario}` : `Chat cerrado ahora · abre ${chat.horario}`}
          </p>
        </div>

        {!chat.activo ? (
          salon.rol === "dueno" ? (
            <Complemento
              nombre="Chat en vivo"
              precio={PRECIO_CHAT}
              incluye={[
                "Tus clientes te escriben desde tu página en Nura",
                "Tú eliges los días y las horas en que el chat está abierto",
                "Fuera de ese horario nadie te escribe; tú sí puedes contestar",
                "Todo tu equipo ve y contesta los mensajes",
              ]}
            />
          ) : (
            <p className="aviso aviso-neutro">Tu barbería todavía no tiene el chat en vivo. Lo activa el encargado.</p>
          )
        ) : (
          <>
            {conversaciones.length > 0 ? (
              <ul className="lista-servicios">
                {conversaciones.map((c) => {
                  const nuevo = c.ultimo_autor === "cliente" && (!c.leido_salon_en || (c.ultimo_mensaje_en ?? "") > c.leido_salon_en);
                  return (
                    <li key={c.id}>
                      <Link href={`/mensajes/${c.id}`} className="fila-cliente">
                        <span className="avatar avatar-sm">{c.nombre.charAt(0).toUpperCase()}</span>
                        <span className="servicio-info">
                          <strong>{c.nombre}</strong>
                          <span className="meta" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: nuevo ? 700 : 400, color: nuevo ? "var(--tinta-900)" : undefined }}>
                            {c.ultimo_autor === "salon" ? "Tú: " : ""}
                            {c.ultimo_texto}
                          </span>
                        </span>
                        <span className="meta" style={{ flex: "none" }}>
                          {c.ultimo_mensaje_en ? (diaLocal(c.ultimo_mensaje_en) === hoy ? horaLocal(c.ultimo_mensaje_en) : haceCuanto(diaLocal(c.ultimo_mensaje_en), hoy)) : ""}
                        </span>
                        {nuevo && <span className="punto-nuevo" aria-label="Sin leer" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="aviso aviso-neutro">Todavía no te escribe nadie. El botón "Chatear" aparece en tu página cuando el chat está abierto.</p>
            )}
            {salon.rol === "dueno" && (
              <section className="tarjeta" aria-labelledby="horario-chat">
                <h2 id="horario-chat" className="etiqueta">Horario del chat</h2>
                <HorarioChat dias={a.chat_dias} inicio={a.chat_inicio} fin={a.chat_fin} />
              </section>
            )}
          </>
        )}
      </div>
      <BarraBarberia activa="cuenta" />
    </main>
  );
}
