import Link from "next/link";
import { BarraBarberia } from "@/components/BarraBarberia";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoBarberia } from "@/lib/sesion";
import { diasDesde, haceCuanto, textoCabello } from "@/lib/formato";
import { hoyLocal } from "@/lib/tiempo";

export const metadata = { title: "Clientes · Nura" };
export const dynamic = "force-dynamic";

const POR_VOLVER = 42; // días sin venir para avisar

type Cliente = { id: string; nombre: string; telefono: string | null; ultima_visita: string | null; tipo_cabello: string | null };

export default async function Clientes({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const sp = await searchParams;
  const { supabase, salon } = await contextoBarberia();
  const hoy = hoyLocal();
  const q = (sp.q ?? "").replace(/[^\p{L}\p{N} ]/gu, "").trim().slice(0, 40);
  const filtro = sp.ver === "volver" ? "volver" : "todos";

  let consulta = supabase
    .from("clientes")
    .select("id, nombre, telefono, ultima_visita, tipo_cabello")
    .eq("salon_id", salon.id)
    .order("nombre")
    .limit(300);
  if (q) consulta = consulta.or(`nombre.ilike.%${q}%,telefono.ilike.%${q.replace(/\s/g, "")}%`);
  if (filtro === "volver") {
    const limite = new Date(Date.parse(`${hoy}T12:00:00Z`) - POR_VOLVER * 86_400_000).toISOString().slice(0, 10);
    consulta = consulta.lt("ultima_visita", limite).order("ultima_visita");
  }
  const { data } = await consulta;
  const clientes = (data ?? []) as Cliente[];
  const { count: total } = await supabase.from("clientes").select("id", { count: "exact", head: true }).eq("salon_id", salon.id);

  return (
    <main className="pantalla">
      <div className="contenido">
        <div className="fila-separada">
          <h1 className="titulo">Clientes</h1>
          <Link href="/clientes/nuevo" className="boton-icono boton-accion" aria-label="Nuevo cliente">
            <Icono nombre="mas" tamano={20} />
          </Link>
        </div>

        {(total ?? 0) > 0 && (
          <>
            <form className="busqueda" role="search" action="/clientes">
              <Icono nombre="buscar" tamano={18} />
              <input name="q" defaultValue={q} placeholder="Nombre o celular" aria-label="Buscar cliente" autoComplete="off" />
              {filtro === "volver" && <input type="hidden" name="ver" value="volver" />}
            </form>
            <nav className="chips-equipo" aria-label="Filtro">
              <Link href={q ? `/clientes?q=${encodeURIComponent(q)}` : "/clientes"} className={`chip${filtro === "todos" ? " activo" : ""}`}>
                Todos · {total}
              </Link>
              <Link href={`/clientes?ver=volver${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={`chip${filtro === "volver" ? " activo" : ""}`}>
                Por volver
              </Link>
            </nav>
          </>
        )}

        {clientes.length > 0 ? (
          <ul className="lista-servicios">
            {clientes.map((c) => {
              const tarde = c.ultima_visita && diasDesde(c.ultima_visita, hoy) > POR_VOLVER;
              return (
                <li key={c.id}>
                  <Link href={`/clientes/${c.id}`} className="fila-cliente">
                    <span className="avatar avatar-sm">{c.nombre.charAt(0).toUpperCase()}</span>
                    <span className="servicio-info">
                      <strong>{c.nombre}</strong>
                      <span className="meta">
                        {c.ultima_visita ? `Vino ${haceCuanto(c.ultima_visita, hoy)}` : "Sin visitas"}
                        {c.tipo_cabello ? ` · ${textoCabello(c.tipo_cabello)}` : ""}
                      </span>
                    </span>
                    {tarde && <span className="etiqueta-azul">Por volver</span>}
                    <Icono nombre="siguiente" tamano={16} />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (total ?? 0) === 0 ? (
          <div className="tarjeta vacio">
            <Icono nombre="clientes" tamano={36} />
            <strong>Aún no tienes clientes.</strong>
            <p>Se agregan solos cuando agendas o cuando alguien reserva en tu página. También puedes agregarlos tú.</p>
            <Link href="/clientes/nuevo" className="btn">
              Agregar cliente
            </Link>
          </div>
        ) : (
          <p className="aviso aviso-neutro">
            {filtro === "volver" ? `Nadie lleva más de ${POR_VOLVER / 7} semanas sin venir.` : "No encontramos a nadie con esa búsqueda."}
          </p>
        )}
      </div>
      <BarraBarberia activa="clientes" />
    </main>
  );
}
