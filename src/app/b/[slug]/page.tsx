import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Icono } from "@/components/Iconos";
import { Logo } from "@/components/Logo";
import { Medalla } from "@/components/Medalla";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { duracionTexto, enlaceWhatsApp, pesos, textoCabello, textoCategoria } from "@/lib/formato";
import { medallaSalon, medallaTrabajo } from "@/lib/medallas";
import { salonPorSlug } from "@/lib/publico";

export const dynamic = "force-dynamic";

type Trabajo = {
  id: string;
  foto_despues: string;
  foto_antes: string | null;
  tipo_cabello: string;
  categoria: string;
  confirmacion: string;
  medalla_cliente: number | null;
  nombre_publico: string | null;
  servicio: { nombre: string; precio: number } | null;
  estilista: { nombre: string } | null;
};
type Servicio = { id: string; nombre: string; duracion_min: number; precio: number; categoria: string };
type Estilista = { id: string; nombre: string; especialidades: string[]; anios_oficio: number | null };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!supabaseConfigurado) return { title: "Nura" };
  const { salon } = await salonPorSlug(slug);
  return salon ? { title: `${salon.nombre} · Nura`, description: `Trabajos reales, precios exactos y reserva en línea. ${salon.colonia}, Guadalajara.` } : { title: "Nura" };
}

export default async function PaginaSalon({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const { slug } = await params;
  const sp = await searchParams;
  const { supabase, salon } = await salonPorSlug(slug);
  if (!salon) notFound();

  const [{ data: dTrabajos }, { data: dServicios }, { data: dEquipo }] = await Promise.all([
    supabase
      .from("trabajos")
      .select("id, foto_despues, foto_antes, tipo_cabello, categoria, confirmacion, medalla_cliente, nombre_publico, servicio:servicios(nombre, precio), estilista:estilistas(nombre)")
      .eq("salon_id", salon.id)
      .eq("publicado", true)
      .order("creado_en", { ascending: false })
      .limit(60),
    supabase.from("servicios").select("id, nombre, duracion_min, precio, categoria").eq("salon_id", salon.id).eq("activo", true).order("orden").order("creado_en"),
    supabase.from("estilistas").select("id, nombre, especialidades, anios_oficio").eq("salon_id", salon.id).eq("activo", true).order("creado_en"),
  ]);
  const todos = (dTrabajos ?? []) as unknown as Trabajo[];
  const servicios = (dServicios ?? []) as Servicio[];
  const equipo = (dEquipo ?? []) as Estilista[];
  const confirmados = todos.filter((t) => t.confirmacion === "con_nombre" || t.confirmacion === "sin_nombre").length;
  const nivel = medallaSalon(salon, confirmados);
  const cabellos = [...new Set(todos.map((t) => t.tipo_cabello))];
  const cabello = cabellos.includes(sp.cabello ?? "") ? sp.cabello : undefined;
  const trabajos = cabello ? todos.filter((t) => t.tipo_cabello === cabello) : todos;
  const columnas: Trabajo[][] = [[], []];
  trabajos.forEach((t, i) => columnas[i % 2].push(t));

  return (
    <main className="pantalla">
      <div className="contenido" style={{ gap: 18 }}>
        <Link href="/" aria-label="Nura">
          <Logo alto={22} />
        </Link>

        {!salon.publicado && (
          <p className="aviso aviso-azul" style={{ margin: 0 }}>
            Tu página está oculta: solo tú la ves. Publícala en Cuenta para que te encuentren y reserven.
          </p>
        )}

        <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1 className="titulo">{salon.nombre}</h1>
          <div className="fila" style={{ gap: 10, flexWrap: "wrap" }}>
            <span className="meta">{salon.colonia}, Guadalajara</span>
            <Medalla nivel={nivel} />
          </div>
          {salon.descripcion && <p style={{ margin: "4px 0 0", color: "var(--tinta-600)", fontSize: 15 }}>{salon.descripcion}</p>}
        </header>

        {todos.length > 0 && (
          <section aria-labelledby="trabajos" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="fila-separada">
              <h2 id="trabajos" className="etiqueta">Trabajos · {todos.length}</h2>
              {confirmados > 0 && <span className="meta">{confirmados} confirmados por clientes</span>}
            </div>
            {cabellos.length > 1 && (
              <nav className="chips-equipo" aria-label="Tipo de cabello">
                <Link href={`/b/${slug}`} className={`chip${!cabello ? " activo" : ""}`} scroll={false}>
                  Todos
                </Link>
                {cabellos.map((c) => (
                  <Link key={c} href={`/b/${slug}?cabello=${c}`} className={`chip${cabello === c ? " activo" : ""}`} scroll={false}>
                    {textoCabello(c)}
                  </Link>
                ))}
              </nav>
            )}
            <div className="feed">
              {columnas.map((col, c) => (
                <div key={c} className="feed-col">
                  {col.map((t) => (
                    <article key={t.id} className="tarjeta-trabajo">
                      <div className="foto" style={{ aspectRatio: "4 / 5" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={t.foto_despues} alt={`${t.servicio?.nombre ?? textoCategoria(t.categoria)} en cabello ${textoCabello(t.tipo_cabello)?.toLowerCase()}`} loading="lazy" />
                        {t.foto_antes && <span className="sello">Antes / Después</span>}
                      </div>
                      <div className="cuerpo">
                        <div className="fila-separada" style={{ gap: 6 }}>
                          <strong>{t.servicio?.nombre ?? textoCategoria(t.categoria)}</strong>
                          {t.servicio && <span className="precio" style={{ fontSize: 14 }}>{pesos(t.servicio.precio)}</span>}
                        </div>
                        <span className="meta">
                          {textoCabello(t.tipo_cabello)}
                          {t.estilista ? ` · ${t.estilista.nombre.split(" ")[0]}` : ""}
                        </span>
                        <Medalla nivel={medallaTrabajo(nivel, t.medalla_cliente, t.confirmacion)} compacta />
                      </div>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="servicios" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h2 id="servicios" className="etiqueta">Servicios y precios</h2>
          {servicios.length > 0 ? (
            <ul className="lista-servicios">
              {servicios.map((s) => (
                <li key={s.id}>
                  <Link href={`/b/${slug}/reservar?servicio=${s.id}`} className="fila-cliente">
                    <span className="servicio-info">
                      <strong style={{ color: "var(--tinta-900)" }}>{s.nombre}</strong>
                      <span className="meta">{duracionTexto(s.duracion_min)}</span>
                    </span>
                    <span className="precio" style={{ color: "var(--tinta-900)" }}>{pesos(s.precio)}</span>
                    <Icono nombre="siguiente" tamano={16} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="meta" style={{ margin: 0 }}>Pronto verás aquí sus servicios.</p>
          )}
        </section>

        {equipo.length > 0 && (
          <section aria-labelledby="equipo" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 id="equipo" className="etiqueta">Quién te atiende</h2>
            <ul className="lista-servicios">
              {equipo.map((e) => (
                <li key={e.id}>
                  <span className="avatar avatar-sm">{e.nombre.charAt(0).toUpperCase()}</span>
                  <span className="servicio-info">
                    <strong>{e.nombre}</strong>
                    {(e.especialidades.length > 0 || e.anios_oficio != null) && (
                      <span className="meta">
                        {[e.anios_oficio != null ? `${e.anios_oficio} ${e.anios_oficio === 1 ? "año" : "años"} de oficio` : null, e.especialidades.join(", ") || null]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(salon.direccion || salon.whatsapp) && (
          <section className="tarjeta" style={{ gap: 6 }}>
            {salon.direccion && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${salon.direccion}, ${salon.colonia}, Guadalajara`)}`} target="_blank" rel="noreferrer" style={{ color: "var(--tinta-900)" }}>
                {salon.direccion}, {salon.colonia}
              </a>
            )}
            {salon.whatsapp && (
              <a href={enlaceWhatsApp(salon.whatsapp, `Hola ${salon.nombre}, te encontré en Nura.`)} target="_blank" rel="noreferrer" className="meta" style={{ color: "var(--accion-500)", fontWeight: 700 }}>
                Escribir por WhatsApp
              </a>
            )}
          </section>
        )}

        {servicios.length > 0 && equipo.length > 0 && (
          <div className="accion-fija">
            <Link className="btn" href={`/b/${slug}/reservar`}>
              Reservar
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
