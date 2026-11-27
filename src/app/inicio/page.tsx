import Link from "next/link";
import { redirect } from "next/navigation";
import { BarraClienta } from "@/components/BarraClienta";
import { Icono } from "@/components/Iconos";
import { Espejo, Logo } from "@/components/Logo";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";
import { CATEGORIAS } from "@/lib/formato";

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
  salon: { nombre: string; slug: string } | null;
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
    .select("id, titulo, foto_despues, foto_antes, tipo_cabello, categoria, colonia, salon:salones(nombre, slug), estilista:estilistas(nombre)")
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

        <div className="busqueda" aria-disabled="true">
          <Icono nombre="buscar" tamano={18} />
          ¿Qué te quieres hacer?
        </div>

        <nav className="chips-equipo" aria-label="Tipo de cabello">
          <Link href={enlace({ cabello: "todos" })} className={`chip${!cabello ? " activo" : ""}`}>
            Todos
          </Link>
          {CABELLOS.map((c) => (
            <Link key={c.valor} href={enlace({ cabello: c.valor })} className={`chip${cabello === c.valor ? " activo" : ""}`}>
              {c.texto}
            </Link>
          ))}
        </nav>
        <nav className="chips-equipo" aria-label="Servicio">
          {CATEGORIAS.map((c) => (
            <Link
              key={c.valor}
              href={enlace({ servicio: servicio === c.valor ? undefined : c.valor })}
              className={`chip chip-suave${servicio === c.valor ? " activo" : ""}`}
            >
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
                  <article key={t.id} className="tarjeta-trabajo">
                    <div className="foto" style={{ height: ALTOS[(i * 2 + c) % ALTOS.length] }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.foto_despues} alt={t.titulo ?? "Trabajo"} loading="lazy" />
                      {t.foto_antes && <span className="sello">Antes / Después</span>}
                    </div>
                    <div className="cuerpo">
                      <span className="autor">{t.estilista?.nombre ?? t.salon?.nombre}</span>
                      <strong>{t.titulo ?? CATEGORIAS.find((x) => x.valor === t.categoria)?.texto}</strong>
                      <span className="meta">
                        {CABELLOS.find((x) => x.valor === t.tipo_cabello)?.texto} · {t.colonia}
                      </span>
                    </div>
                  </article>
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
