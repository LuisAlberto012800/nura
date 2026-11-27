import Link from "next/link";
import { redirect } from "next/navigation";
import { BarraClienta } from "@/components/BarraClienta";
import { Espejo, Logo } from "@/components/Logo";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";
import { CATEGORIAS } from "@/lib/formato";
import { TarjetaTrabajo } from "@/components/TarjetaTrabajo";
import { medallaSalon, medallaTrabajo } from "@/lib/medallas";

export const metadata = { title: "Descubrir · Nura" };
export const dynamic = "force-dynamic";

const CABELLOS = [
  { valor: "lacio", texto: "Lacio" },
  { valor: "ondulado", texto: "Ondulado" },
  { valor: "rizado", texto: "Rizado" },
  { valor: "afro", texto: "Afro" },
] as const;

type Trabajo = {
  id: string;
  titulo: string | null;
  foto_despues: string;
  foto_antes: string | null;
  tipo_cabello: string;
  categoria: string;
  colonia: string;
  confirmacion: string;
  medalla_cliente: number | null;
  servicio: { nombre: string; precio: number } | null;
  salon: { nombre: string; slug: string; whatsapp: string | null; local_verificado_en: string | null; identidad_verificada_en: string | null } | null;
  estilista: { nombre: string } | null;
};

const ALTOS = [220, 170, 190, 240, 160, 210];

export default async function Descubrir({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const sp = await searchParams;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // El tipo de cabello guardado en "Tú" es el filtro por defecto.
  const guardado = user.user_metadata?.cabello as string | undefined;
  const cabello = sp.cabello === "todos" ? undefined : (sp.cabello ?? guardado);
  const servicio = CATEGORIAS.some((c) => c.valor === sp.servicio) ? sp.servicio : undefined;

  let consulta = supabase
    .from("trabajos")
    .select("id, titulo, foto_despues, foto_antes, tipo_cabello, categoria, colonia, confirmacion, medalla_cliente, servicio:servicios(nombre, precio), salon:salones(nombre, slug, whatsapp, local_verificado_en, identidad_verificada_en), estilista:estilistas(nombre)")
    .eq("publicado", true)
    .order("creado_en", { ascending: false })
    .limit(40);
  if (cabello && CABELLOS.some((c) => c.valor === cabello)) consulta = consulta.eq("tipo_cabello", cabello);
  if (servicio) consulta = consulta.eq("categoria", servicio);
  const { data } = await consulta;
  const trabajos = (data ?? []) as unknown as Trabajo[];

  const columnas: Trabajo[][] = [[], []];
  const alturas = [0, 0];
  trabajos.forEach((t, i) => {
    const c = alturas[0] <= alturas[1] ? 0 : 1;
    columnas[c].push(t);
    alturas[c] += ALTOS[i % ALTOS.length] + 90;
  });

  const enlace = (cambios: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const final = { cabello: sp.cabello ?? (guardado ? guardado : undefined), servicio, ...cambios };
    Object.entries(final).forEach(([k, v]) => v && p.set(k, v));
    const q = p.toString();
    return q ? `/inicio?${q}` : "/inicio";
  };
  const textoCabello = CABELLOS.find((c) => c.valor === cabello)?.texto;

  return (
    <main className="pantalla">
      <div className="contenido" style={{ gap: 14 }}>
        <div className="fila-separada">
          <Logo alto={30} />
          <span className="ubicacion">
            <span className="punto-azul" />
            Guadalajara
          </span>
        </div>

        <nav className="chips-equipo" aria-label="Filtrar">
          <Link href={enlace({ cabello: "todos", servicio: undefined })} className={`chip${!cabello && !servicio ? " activo" : ""}`}>
            Todos
          </Link>
          {CABELLOS.map((c) => (
            <Link key={c.valor} href={enlace({ cabello: cabello === c.valor ? "todos" : c.valor })} className={`chip${cabello === c.valor ? " activo" : ""}`}>
              {c.texto}
            </Link>
          ))}
          <span className="separador-chips" aria-hidden="true" />
          {CATEGORIAS.map((c) => (
            <Link key={c.valor} href={enlace({ servicio: servicio === c.valor ? undefined : c.valor })} className={`chip${servicio === c.valor ? " activo" : ""}`}>
              {c.texto}
            </Link>
          ))}
        </nav>

        <div className="fila-separada" style={{ alignItems: "baseline" }}>
          <h1 className="titulo" style={{ fontSize: 24 }}>
            Cerca de ti
          </h1>
          <span className="meta">{textoCabello ? `para cabello ${textoCabello.toLowerCase()}` : "todos los tipos de cabello"}</span>
        </div>

        {trabajos.length > 0 ? (
          <div className="feed">
            {columnas.map((col, c) => (
              <div key={c} className="feed-col">
                {col.map((t, i) => (
                  <TarjetaTrabajo
                    key={t.id}
                    alto={ALTOS[(i * 2 + c) % ALTOS.length]}
                    t={{ ...t, salonNombre: t.salon?.nombre, nivel: t.salon ? medallaTrabajo(medallaSalon(t.salon), t.medalla_cliente, t.confirmacion) : 0 }}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="tarjeta vacio">
            <Espejo tamano={44} />
            <strong>
              {cabello || servicio ? "Todavía no hay trabajos con esos filtros." : "Todavía no hay trabajos publicados."}
            </strong>
            <p>
              Estamos sumando barberías y estéticas de Guadalajara. Muy pronto vas a ver aquí trabajos reales cerca de ti, con
              su precio y quién los hizo.
            </p>
            {(cabello || servicio) && (
              <Link href="/inicio?cabello=todos" className="btn btn-sec">
                Ver todos
              </Link>
            )}
          </div>
        )}
      </div>
      <BarraClienta activa="inicio" />
    </main>
  );
}
