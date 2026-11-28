import Link from "next/link";
import { BarraBarberia } from "@/components/BarraBarberia";
import { Encabezado } from "@/components/Encabezado";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoEncargado } from "@/lib/sesion";
import { pesos } from "@/lib/formato";
import { PRECIO_BOT, PRECIO_CHAT, PRECIO_INSIGHTS, PRECIO_VACANTES } from "@/lib/insights";
import { hoyLocal } from "@/lib/tiempo";

export const metadata = { title: "Complementos · Nura" };
export const dynamic = "force-dynamic";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const COMPLEMENTOS = [
  { columna: "insights_hasta", nombre: "Nura Insights", href: "/negocio", precio: PRECIO_INSIGHTS, que: "Cobrado, por cobrar y qué clientes regresan" },
  { columna: "bot_hasta", nombre: "Bot de WhatsApp", href: "/bot", precio: PRECIO_BOT, que: "Tus clientes reservan por WhatsApp, a cualquier hora" },
  { columna: "chat_hasta", nombre: "Chat en vivo", href: "/mensajes", precio: PRECIO_CHAT, que: "Te escriben desde tu página en tu horario de chat" },
  { columna: "vacantes_hasta", nombre: "Vacantes", href: "/vacantes", precio: PRECIO_VACANTES, que: "Publica vacantes que solo ven barberos" },
] as const;

export default async function Complementos() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { supabase, salon } = await contextoEncargado();
  // "*" para que la pantalla funcione aunque falte alguna migración.
  const { data } = await supabase.from("salones").select("*").eq("id", salon.id).maybeSingle();
  const fechas = (data ?? {}) as Record<string, string | null>;
  const hoy = hoyLocal();
  const lista = COMPLEMENTOS.map((c) => {
    const hasta = fechas[c.columna] ? String(fechas[c.columna]) : null;
    return { ...c, activo: !!hasta && hasta >= hoy, hasta };
  });
  const activos = lista.filter((c) => c.activo);
  const total = activos.reduce((s, c) => s + c.precio, 0);

  return (
    <main className="pantalla">
      <div className="contenido">
        <Encabezado titulo="Complementos" volver="/hoy" />
        <p className="subtitulo" style={{ margin: 0 }}>
          {activos.length ? `${activos.length} activo${activos.length === 1 ? "" : "s"} · ${pesos(total)} al mes` : "Actívalos solo si los necesitas. Se pagan mes a mes."}
        </p>
        <ul className="lista-complementos">
          {lista.map((c) => (
            <li key={c.href}>
              <Link href={c.href} className={`complemento${c.activo ? " activo" : ""}`}>
                <span className="complemento-cuerpo">
                  <strong>{c.nombre}</strong>
                  <span>{c.que}</span>
                  {c.activo && c.hasta ? (
                    <span className="estado-activo">Activo hasta el {Number(c.hasta.slice(8, 10))} de {MESES[Number(c.hasta.slice(5, 7)) - 1]}
                      {c.hasta.slice(0, 4) !== hoy.slice(0, 4) ? ` de ${c.hasta.slice(0, 4)}` : ""}</span>
                  ) : (
                    <span className="meta">{pesos(c.precio)} al mes</span>
                  )}
                </span>
                <span className="complemento-accion">
                  {c.activo ? "Abrir" : "Ver"}
                  <Icono nombre="siguiente" tamano={14} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="meta" style={{ margin: 0, textAlign: "center" }}>Lo de siempre sigue gratis: agenda, clientes, portafolio, cupones y tu página.</p>
      </div>
      <BarraBarberia activa="cuenta" />
    </main>
  );
}
