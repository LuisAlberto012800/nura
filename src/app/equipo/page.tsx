import Link from "next/link";
import { redirect } from "next/navigation";
import { BarraBarberia } from "@/components/BarraBarberia";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";
import { salonDelUsuario } from "@/lib/salon";
import { DIAS, horaCorta } from "@/lib/horarios";
import { FormularioNuevo } from "./FormularioNuevo";

export const metadata = { title: "Equipo y horarios · Nura" };
export const dynamic = "force-dynamic";

type Estilista = {
  id: string;
  nombre: string;
  especialidades: string[];
  activo: boolean;
  horarios: { dia: number; inicio: string; fin: string }[];
};

// "Lun a sáb · 10:00 a 20:00" cuando todos los días tienen la misma hora; si no, los días.
function resumenHorario(h: Estilista["horarios"]): string {
  if (h.length === 0) return "Sin horario todavía";
  const orden = DIAS.map((d) => d.valor);
  const dias = [...h].sort((a, b) => orden.indexOf(a.dia) - orden.indexOf(b.dia));
  const nombres = dias.map((d) => DIAS.find((x) => x.valor === d.dia)!.texto.slice(0, 3).toLowerCase());
  const mismaHora = dias.every((d) => d.inicio === dias[0].inicio && d.fin === dias[0].fin);
  const lista = nombres.length > 2 && dias.every((d, i) => i === 0 || orden.indexOf(d.dia) === orden.indexOf(dias[i - 1].dia) + 1)
    ? `${nombres[0]} a ${nombres[nombres.length - 1]}`
    : nombres.join(", ");
  const texto = lista.charAt(0).toUpperCase() + lista.slice(1);
  return mismaHora ? `${texto} · ${horaCorta(dias[0].inicio)} a ${horaCorta(dias[0].fin)}` : `${texto} · horario por día`;
}

export default async function Equipo() {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const salon = await salonDelUsuario(supabase, user.id);
  if (!salon) redirect("/alta");

  const { data } = await supabase
    .from("estilistas")
    .select("id, nombre, especialidades, activo, horarios(dia, inicio, fin)")
    .eq("salon_id", salon.id)
    .order("creado_en");
  const equipo = (data ?? []) as Estilista[];

  return (
    <main className="pantalla">
      <div className="contenido">
        <Link href="/cuenta" className="volver">
          <Icono nombre="atras" tamano={18} />
          Cuenta
        </Link>
        <div>
          <h1 className="titulo">Equipo y horarios</h1>
          <p className="subtitulo">Quién atiende y cuándo. La agenda solo ofrece horarios dentro de estas horas.</p>
        </div>

        <ul className="lista-servicios">
          {equipo.map((e) => (
            <li key={e.id} className={e.activo ? undefined : "oculto"}>
              <Link href={`/equipo/${e.id}`} className="servicio-info">
                <strong>{e.nombre}</strong>
                <span className="meta">
                  {e.activo ? resumenHorario(e.horarios) : "No aparece en la agenda ni en tu página"}
                </span>
                {e.especialidades.length > 0 && <span className="meta">{e.especialidades.join(" · ")}</span>}
              </Link>
              <span style={{ color: "var(--tinta-400)", display: "inline-flex" }}>
                <Icono nombre="siguiente" tamano={18} />
              </span>
            </li>
          ))}
        </ul>

        <section className="tarjeta" aria-labelledby="nuevo">
          <h2 id="nuevo" className="etiqueta">Agregar a alguien del equipo</h2>
          <FormularioNuevo />
        </section>
      </div>
      <BarraBarberia activa="cuenta" />
    </main>
  );
}
