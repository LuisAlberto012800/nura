import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Icono } from "@/components/Iconos";
import { Regresar } from "@/components/Regresar";
import { Verificado } from "@/components/Encabezado";
import { Medalla } from "@/components/Medalla";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { duracionTexto, enlaceWhatsApp, pesos, textoCabello, textoCategoria } from "@/lib/formato";
import { medallaSalon, medallaTrabajo } from "@/lib/medallas";
import { salonPorSlug } from "@/lib/publico";
import { enlaceBot } from "@/lib/insights";
import { diaSemana, hoyLocal } from "@/lib/tiempo";

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
type Estilista = { id: string; nombre: string; especialidades: string[]; anios_oficio: number | null; foto_url: string | null; horarios: { dia: number }[] };

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
    supabase.from("estilistas").select("id, nombre, especialidades, anios_oficio, foto_url, horarios(dia)").eq("salon_id", salon.id).eq("activo", true).order("creado_en"),
  ]);
  const todos = (dTrabajos ?? []) as unknown as Trabajo[];
  const servicios = (dServicios ?? []) as Servicio[];
  const equipo = (dEquipo ?? []) as Estilista[];
  const confirmados = todos.filter((t) => t.confirmacion === "con_nombre" || t.confirmacion === "sin_nombre").length;
  const nivel = medallaSalon(salon, confirmados);
  const cabellos = [...new Set(todos.map((t) => t.tipo_cabello))];
  const cabello = cabellos.includes(sp.cabello ?? "") ? sp.cabello : undefined;
  const trabajos = cabello ? todos.filter((t) => t.tipo_cabello === cabello) : todos;
  const hoy = diaSemana(hoyLocal());
  const atiendenHoy = equipo.filter((e) => e.horarios.some((h) => h.dia === hoy)).length;
  const anios = Math.max(0, ...equipo.map((e) => e.anios_oficio ?? 0));
  const portada = salon.portada_url ?? todos[0]?.foto_despues;
  const bot = salon.bot_hasta && salon.bot_hasta >= hoyLocal() ? enlaceBot(salon.slug) : null;
  const puedeReservar = servicios.length > 0 && equipo.some((e) => e.horarios.length > 0);

  return (
    <main className="pantalla pagina-salon">
      <div className="portada">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {portada && <img src={portada} alt="" />}
        <div className="sobre-fotos">
          <Regresar respaldo="/" clase="boton-redondo sobre-foto" />
          <a
            className="boton-redondo sobre-foto"
            aria-label="Compartir por WhatsApp"
            href={`https://wa.me/?text=${encodeURIComponent(`Mira ${salon.nombre} en Nura: trabajos reales y precios exactos.`)}`}
            target="_blank"
            rel="noreferrer"
          >
            <Icono nombre="compartir" tamano={20} />
          </a>
        </div>
        <span className="noren" aria-hidden="true" />
      </div>

      <div className="contenido" style={{ paddingTop: 4, gap: 16 }}>
        {!salon.publicado && (
          <p className="aviso aviso-azul" style={{ margin: 0 }}>
            Tu página está oculta: solo tú la ves. Publícala en Cuenta para que te encuentren y reserven.
          </p>
        )}

        <header style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h1 className="titulo nombre-salon">
            {salon.nombre}
            {nivel >= 2 && <Verificado grande />}
          </h1>
          <p className="subtitulo" style={{ margin: 0 }}>{salon.colonia}, Guadalajara</p>
          {salon.descripcion && <p style={{ margin: "4px 0 0", color: "var(--tinta-600)", fontSize: 14 }}>{salon.descripcion}</p>}
        </header>

        <div className="fila" style={{ gap: 8, flexWrap: "wrap" }}>
          {atiendenHoy > 0 && <span className="pastilla accion">Con horarios hoy</span>}
          <span className="pastilla">
            <Medalla nivel={nivel} />
          </span>
        </div>

        <div className="estadisticas">
          <div>
            <strong>{todos.length}</strong>
            <span>trabajos</span>
          </div>
          <div>
            <strong>{confirmados}</strong>
            <span>confirmados</span>
          </div>
          <div>
            <strong>{anios > 0 ? anios : equipo.length}</strong>
            <span>{anios > 0 ? "años de oficio" : equipo.length === 1 ? "persona" : "personas"}</span>
          </div>
        </div>

        {todos.length > 0 && (
          <section aria-labelledby="portafolio" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="seccion-titulo">
              <h2 id="portafolio">Portafolio</h2>
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
            <div className="portafolio">
              {trabajos.map((t) => (
                <Link key={t.id} href={`/t/${t.id}`} aria-label={`${t.servicio?.nombre ?? textoCategoria(t.categoria)} en cabello ${textoCabello(t.tipo_cabello)?.toLowerCase()}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.foto_despues} alt="" loading="lazy" />
                  {medallaTrabajo(nivel, t.medalla_cliente, t.confirmacion) > 0 && (
                    <span className="check-galeria" aria-hidden="true">
                      <Icono nombre="check" tamano={12} grosor={3} />
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="servicios">
          <div className="seccion-titulo" style={{ marginBottom: 4 }}>
            <h2 id="servicios">Servicios y precios</h2>
          </div>
          {servicios.length > 0 ? (
            <ul className="filas">
              {servicios.map((s) => (
                <li key={s.id}>
                  <Link href={`/b/${slug}/reservar?servicio=${s.id}`} className="fila-precio">
                    <p>
                      {s.nombre}
                      <small>{duracionTexto(s.duracion_min)}</small>
                    </p>
                    <span className="precio">{pesos(s.precio)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="meta" style={{ margin: 0 }}>Pronto verás aquí sus servicios.</p>
          )}
        </section>

        {equipo.length > 0 && (
          <section aria-labelledby="equipo">
            <div className="seccion-titulo" style={{ marginBottom: 4 }}>
              <h2 id="equipo">Quién te atiende</h2>
            </div>
            <ul className="filas">
              {equipo.map((e) => (
                <li key={e.id} className="fila-precio" style={{ justifyContent: "flex-start" }}>
                  {e.foto_url ? (
                    <span className="avatar-foto" style={{ width: 48, height: 48 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={e.foto_url} alt={e.nombre} />
                    </span>
                  ) : (
                    <span className="avatar avatar-sm" style={{ width: 48, height: 48 }}>{e.nombre.charAt(0).toUpperCase()}</span>
                  )}
                  <p style={{ flex: 1, minWidth: 0 }}>
                    {e.nombre}
                    {(e.especialidades.length > 0 || e.anios_oficio != null) && (
                      <small>
                        {[e.anios_oficio != null ? `${e.anios_oficio} ${e.anios_oficio === 1 ? "año" : "años"} de oficio` : null, e.especialidades.join(", ") || null].filter(Boolean).join(" · ")}
                      </small>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(salon.direccion || salon.whatsapp || bot) && (
          <ul className="filas">
            {bot && (
              <li>
                <a className="fila-precio" href={bot} target="_blank" rel="noreferrer" style={{ color: "var(--accion-500)" }}>
                  <p>
                    Reservar por WhatsApp
                    <small>Te contesta al instante, a cualquier hora</small>
                  </p>
                  <Icono nombre="mensaje" tamano={18} />
                </a>
              </li>
            )}
            {salon.direccion && (
              <li>
                <a className="fila-precio" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${salon.direccion}, ${salon.colonia}, Guadalajara`)}`} target="_blank" rel="noreferrer">
                  <p>
                    {salon.direccion}
                    <small>{salon.colonia} · Cómo llegar</small>
                  </p>
                  <Icono nombre="siguiente" tamano={16} />
                </a>
              </li>
            )}
            {salon.whatsapp && (
              <li>
                <a className="fila-precio" href={enlaceWhatsApp(salon.whatsapp, `Hola ${salon.nombre}, te encontré en Nura.`)} target="_blank" rel="noreferrer">
                  <p>
                    Escribir por WhatsApp
                    <small>Respuesta directa de la barbería</small>
                  </p>
                  <Icono nombre="mensaje" tamano={18} />
                </a>
              </li>
            )}
          </ul>
        )}

        {puedeReservar && (
          <div className="accion-fija">
            <span className="precio-barra">
              <span>{atiendenHoy > 0 ? "Hoy hay horarios" : "Reserva sin cuenta"}</span>
              <strong style={{ fontSize: 15 }}>{servicios.length} {servicios.length === 1 ? "servicio" : "servicios"}</strong>
            </span>
            <Link className="btn" href={`/b/${slug}/reservar`}>
              Reservar
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
