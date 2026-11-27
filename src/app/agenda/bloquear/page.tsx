import Link from "next/link";
import { redirect } from "next/navigation";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { sesionActual } from "@/lib/sesion";
import { salonDelUsuario } from "@/lib/salon";
import { HORAS } from "@/lib/horarios";
import { esDiaValido, fechaLarga, hoyLocal } from "@/lib/tiempo";
import { FormularioBloqueo } from "./FormularioBloqueo";

export const metadata = { title: "Bloquear horario · Nura" };
export const dynamic = "force-dynamic";

export default async function Bloquear({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const sp = await searchParams;
  const { supabase, user } = await sesionActual();
  if (!user) redirect("/entrar");
  const salon = await salonDelUsuario(supabase, user.id);
  if (!salon) redirect("/alta");

  const dia = esDiaValido(sp.dia) ? sp.dia : hoyLocal();
  const { data: equipo } = await supabase
    .from("estilistas")
    .select("id, nombre")
    .eq("salon_id", salon.id)
    .eq("activo", true)
    .order("creado_en");
  const estilistaId = (equipo ?? []).find((e) => e.id === sp.e)?.id ?? equipo?.[0]?.id ?? "";

  return (
    <main className="pantalla">
      <div className="contenido">
        <Link href={`/agenda?dia=${dia}&e=${estilistaId}`} className="volver">
          <Icono nombre="atras" tamano={18} />
          Agenda
        </Link>
        <div>
          <h1 className="titulo">Bloquear horario</h1>
          <p className="subtitulo">{fechaLarga(dia)} · nadie podrá reservar en esas horas.</p>
        </div>
        {estilistaId ? (
          <FormularioBloqueo dia={dia} estilistaId={estilistaId} equipo={equipo ?? []} horas={HORAS} />
        ) : (
          <p className="aviso aviso-neutro">Primero agrega a alguien a tu equipo.</p>
        )}
      </div>
    </main>
  );
}
