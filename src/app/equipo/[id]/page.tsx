import Link from "next/link";
import { notFound } from "next/navigation";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoEncargado } from "@/lib/sesion";
import { DIAS, horaCorta, horarioSugerido, type DiaHorario } from "@/lib/horarios";
import { cambiarActivo } from "../acciones";
import { FormularioEstilista } from "../FormularioEstilista";
import { BotonBaja } from "../MasBarbero";

export const metadata = { title: "Estilista · Nura" };
export const dynamic = "force-dynamic";

export default async function EditarEstilista({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { id } = await params;
  const sp = await searchParams;
  const { supabase, user } = await contextoEncargado();

  // Las reglas de la base de datos solo devuelven estilistas del salón propio.
  const { data: estilista } = await supabase
    .from("estilistas")
    .select("id, nombre, especialidades, anios_oficio, activo, usuario_id, horarios(dia, inicio, fin)")
    .eq("id", id)
    .maybeSingle();
  if (!estilista) notFound();

  const guardado = (estilista.horarios ?? []) as { dia: number; inicio: string; fin: string }[];
  const esSugerido = guardado.length === 0;
  const horario: DiaHorario[] = esSugerido
    ? horarioSugerido()
    : DIAS.map((d) => {
        const h = guardado.find((x) => x.dia === d.valor);
        return h
          ? { dia: d.valor, atiende: true, inicio: horaCorta(h.inicio), fin: horaCorta(h.fin) }
          : { dia: d.valor, atiende: false, inicio: "10:00", fin: "20:00" };
      });
  const esYo = estilista.usuario_id === user.id;
  const { count: pendientes } = await supabase
    .from("citas")
    .select("id", { count: "exact", head: true })
    .eq("estilista_id", estilista.id)
    .in("estado", ["por_confirmar", "confirmada"])
    .gte("inicio", new Date().toISOString());

  return (
    <main className="pantalla">
      <div className="contenido">
        <Link href="/equipo" className="volver">
          <Icono nombre="atras" tamano={18} />
          Equipo
        </Link>
        <div>
          <h1 className="titulo">{estilista.nombre}</h1>
          {esYo && <p className="subtitulo">Este es tu perfil.</p>}
          {!esYo && estilista.usuario_id && <p className="subtitulo">Tiene cuenta en Nura: ve la agenda y sube sus trabajos. El horario solo lo cambias tú.</p>}
        </div>
        {sp.nuevo && (
          <p className="aviso aviso-exito" role="status" style={{ margin: 0 }}>
            Ya es parte de tu equipo. Revisa su horario y toca Guardar.
          </p>
        )}

        <FormularioEstilista
          estilista={{
            id: estilista.id,
            nombre: estilista.nombre,
            especialidades: estilista.especialidades ?? [],
            anios_oficio: estilista.anios_oficio,
          }}
          horario={horario}
          esSugerido={esSugerido}
        />

        {!esYo && estilista.activo && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <BotonBaja id={estilista.id} nombre={estilista.nombre} conCuenta={!!estilista.usuario_id} citas={pendientes ?? 0} />
            <p className="meta">Deja de aparecer en la agenda y en tu página. Se conservan sus citas y trabajos.</p>
          </div>
        )}
        {!esYo && !estilista.activo && (
          <form action={cambiarActivo}>
            <input type="hidden" name="id" value={estilista.id} />
            <input type="hidden" name="activo" value="false" />
            <button type="submit" className="btn btn-sec">
              Volver a activar
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
