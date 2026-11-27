import Link from "next/link";
import { BarraBarberia } from "@/components/BarraBarberia";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoBarberia } from "@/lib/sesion";
import { textoCabello, textoCategoria } from "@/lib/formato";

export const metadata = { title: "Portafolio · Nura" };
export const dynamic = "force-dynamic";

type Trabajo = {
  id: string;
  titulo: string | null;
  foto_despues: string | null;
  foto_antes: string | null;
  tipo_cabello: string | null;
  categoria: string | null;
  publicado: boolean;
  confirmacion: string;
  muestra_cara: boolean;
  nombre_publico: string | null;
  servicio: { nombre: string } | null;
};

const FILTROS = [
  { clave: "todos", texto: "Todos" },
  { clave: "esperando", texto: "Por confirmar" },
  { clave: "ocultos", texto: "Ocultos" },
] as const;

function estado(t: Trabajo): { texto: string; tono: "ok" | "espera" | "apagado" } {
  if (t.confirmacion === "rechazado") return { texto: "Tu cliente pidió no publicarlo", tono: "apagado" };
  if (t.confirmacion === "con_nombre" || t.confirmacion === "sin_nombre")
    return { texto: `Confirmado${t.nombre_publico ? ` por ${t.nombre_publico}` : ""}`, tono: "ok" };
  if (!t.publicado) return { texto: t.muestra_cara ? "Se publica cuando lo confirme" : "Oculto", tono: t.muestra_cara ? "espera" : "apagado" };
  return { texto: "Publicado · sin confirmar", tono: "espera" };
}

export default async function Portafolio({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const sp = await searchParams;
  const { supabase, user, salon } = await contextoBarberia();
  const { data: yo } = await supabase.from("estilistas").select("id").eq("salon_id", salon.id).eq("usuario_id", user.id).maybeSingle();
  // El barbero ve sus trabajos; el encargado, los de todo el equipo.
  const mias: Record<string, string> = salon.rol === "estilista" && yo ? { estilista_id: yo.id } : {};
  const { data } = await supabase
    .from("trabajos")
    .select("id, titulo, foto_despues, foto_antes, tipo_cabello, categoria, publicado, confirmacion, muestra_cara, nombre_publico, servicio:servicios(nombre)")
    .eq("salon_id", salon.id)
    .match(mias)
    .order("creado_en", { ascending: false })
    .limit(200);
  const todos = (data ?? []) as unknown as Trabajo[];
  const filtro = FILTROS.some((f) => f.clave === sp.ver) ? sp.ver : "todos";
  const lista = todos.filter((t) =>
    filtro === "esperando" ? t.confirmacion === "pendiente" : filtro === "ocultos" ? !t.publicado : true,
  );
  const publicados = todos.filter((t) => t.publicado).length;
  const columnas: Trabajo[][] = [[], []];
  lista.forEach((t, i) => columnas[i % 2].push(t));

  return (
    <main className="pantalla">
      <div className="contenido">
        <div className="fila-separada">
          <div>
            <h1 className="titulo">Tu portafolio</h1>
            <p className="subtitulo">
              {publicados} {publicados === 1 ? "trabajo publicado" : "trabajos publicados"}
            </p>
          </div>
          <Link href="/subir" className="boton-icono boton-accion" aria-label="Subir trabajo">
            <Icono nombre="mas" tamano={20} />
          </Link>
        </div>

        {todos.length > 0 ? (
          <>
            <nav className="chips-equipo" aria-label="Filtro">
              {FILTROS.map((f) => {
                const n = f.clave === "esperando" ? todos.filter((t) => t.confirmacion === "pendiente").length : f.clave === "ocultos" ? todos.filter((t) => !t.publicado).length : todos.length;
                return (
                  <Link key={f.clave} href={f.clave === "todos" ? "/trabajos" : `/trabajos?ver=${f.clave}`} className={`chip${filtro === f.clave ? " activo" : ""}`}>
                    {f.texto}
                    {f.clave !== "todos" && n > 0 ? ` · ${n}` : ""}
                  </Link>
                );
              })}
            </nav>
            {lista.length > 0 ? (
              <div className="feed">
                {columnas.map((col, c) => (
                  <div key={c} className="feed-col">
                    {col.map((t) => {
                      const e = estado(t);
                      return (
                        <Link key={t.id} href={`/trabajos/${t.id}`} className="tarjeta-trabajo">
                          <div className="foto" style={{ aspectRatio: "4 / 5" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={t.foto_despues ?? ""} alt="" loading="lazy" style={{ opacity: t.publicado ? 1 : 0.6 }} />
                            {t.foto_antes && <span className="sello">Antes / Después</span>}
                          </div>
                          <div className="cuerpo">
                            <strong>{t.titulo ?? t.servicio?.nombre ?? textoCategoria(t.categoria)}</strong>
                            <span className="meta">{textoCabello(t.tipo_cabello)}</span>
                            <span className={`estado-trabajo ${e.tono}`}>
                              <i aria-hidden="true" />
                              {e.texto}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <p className="aviso aviso-neutro">No hay trabajos con este filtro.</p>
            )}
          </>
        ) : (
          <div className="tarjeta vacio">
            <Icono nombre="camara" tamano={36} />
            <strong>Sube tu primer trabajo.</strong>
            <p>Una foto de después, el servicio y el tipo de cabello. Así te encuentran clientas con cabello como el que tú trabajas.</p>
            <Link href="/subir" className="btn">
              Subir trabajo
            </Link>
          </div>
        )}
      </div>
      <BarraBarberia activa="cuenta" />
    </main>
  );
}
