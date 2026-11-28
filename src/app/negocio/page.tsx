import Link from "next/link";
import { BarraBarberia } from "@/components/BarraBarberia";
import { Icono } from "@/components/Iconos";
import { SinConfigurar } from "@/components/SinConfigurar";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { contextoEncargado } from "@/lib/sesion";
import { enlaceWhatsApp, pesos } from "@/lib/formato";
import { insightsActivo, PRECIO_INSIGHTS } from "@/lib/insights";
import { aInstante, diaSemana, hoyLocal, sumarDias } from "@/lib/tiempo";

export const metadata = { title: "Negocio · Nura" };
export const dynamic = "force-dynamic";

const PERIODOS = [
  { clave: "semana", texto: "Esta semana" },
  { clave: "mes", texto: "Este mes" },
  { clave: "trimestre", texto: "3 meses" },
] as const;

const SIN_VOLVER = 42; // días

type Completada = { inicio: string; precio: number | null; cliente_id: string | null; estilista_id: string; estilista: { nombre: string } | null };

export default async function Negocio({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!supabaseConfigurado) return <SinConfigurar />;
  const sp = await searchParams;
  const { supabase, salon } = await contextoEncargado();
  const activo = await insightsActivo(supabase, salon.id);

  if (!activo) return <SinInsights />;

  const hoy = hoyLocal();
  const periodo = PERIODOS.find((p) => p.clave === sp.p)?.clave ?? "semana";
  const desde = periodo === "semana" ? sumarDias(hoy, -((diaSemana(hoy) + 6) % 7)) : periodo === "mes" ? `${hoy.slice(0, 8)}01` : sumarDias(hoy, -90);
  const hasta = periodo === "semana" ? sumarDias(desde, 7) : periodo === "mes" ? siguienteMes(hoy) : sumarDias(hoy, 1);
  const inicio = aInstante(desde, "00:00");
  const fin = aInstante(hasta, "00:00");
  const limiteSinVolver = sumarDias(hoy, -SIN_VOLVER);

  const [{ data: dCompletadas }, { data: dPorCobrar }, { count: sinVolver }, { count: conVisitas }] = await Promise.all([
    supabase
      .from("citas")
      .select("inicio, precio, cliente_id, estilista_id, estilista:estilistas(nombre)")
      .eq("salon_id", salon.id)
      .eq("estado", "completada")
      .gte("inicio", aInstante(sumarDias(hoy, -400), "00:00"))
      .lt("inicio", fin)
      .limit(10000),
    supabase.from("citas").select("precio").eq("salon_id", salon.id).in("estado", ["por_confirmar", "confirmada"]).gte("inicio", inicio).lt("inicio", fin),
    supabase.from("clientes").select("id", { count: "exact", head: true }).eq("salon_id", salon.id).lt("ultima_visita", limiteSinVolver),
    supabase.from("clientes").select("id", { count: "exact", head: true }).eq("salon_id", salon.id).not("ultima_visita", "is", null),
  ]);

  const completadas = (dCompletadas ?? []) as unknown as Completada[];
  const enPeriodo = completadas.filter((c) => Date.parse(c.inicio) >= Date.parse(inicio));
  const antes = completadas.filter((c) => Date.parse(c.inicio) < Date.parse(inicio));
  const cobrado = enPeriodo.reduce((t, c) => t + (c.precio ?? 0), 0);
  const porCobrar = ((dPorCobrar ?? []) as { precio: number | null }[]).reduce((t, c) => t + (c.precio ?? 0), 0);
  const citasPorCobrar = (dPorCobrar ?? []).length;

  // Clientes del periodo: nuevos (primera visita) y los que regresan (ya habían venido).
  const vinieronAntes = new Set(antes.map((c) => c.cliente_id).filter(Boolean));
  const delPeriodo = new Set(enPeriodo.map((c) => c.cliente_id).filter(Boolean) as string[]);
  const regresan = [...delPeriodo].filter((id) => vinieronAntes.has(id)).length;
  const nuevos = delPeriodo.size - regresan;

  const porEstilista = Object.values(
    enPeriodo.reduce<Record<string, { nombre: string; total: number; citas: number }>>((acc, c) => {
      const k = c.estilista_id;
      acc[k] ??= { nombre: c.estilista?.nombre ?? "Sin nombre", total: 0, citas: 0 };
      acc[k].total += c.precio ?? 0;
      acc[k].citas += 1;
      return acc;
    }, {}),
  ).sort((a, b) => b.total - a.total);
  const maximo = Math.max(1, ...porEstilista.map((e) => e.total));
  const pctSinVolver = conVisitas ? Math.round(((sinVolver ?? 0) / conVisitas) * 100) : 0;

  return (
    <main className="pantalla">
      <div className="contenido">
        <Link href="/complementos" className="volver">
          <Icono nombre="atras" tamano={18} />
          Complementos
        </Link>
        <div>
          <h1 className="titulo">Negocio</h1>
          <p className="subtitulo">Nura Insights · solo lo ves tú</p>
        </div>

        <nav className="chips-equipo" aria-label="Periodo">
          {PERIODOS.map((p) => (
            <Link key={p.clave} href={p.clave === "semana" ? "/negocio" : `/negocio?p=${p.clave}`} className={`chip${periodo === p.clave ? " activo" : ""}`}>
              {p.texto}
            </Link>
          ))}
        </nav>

        <section aria-labelledby="dinero" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 id="dinero" className="etiqueta">Dinero</h2>
          <div className="cifras-grandes">
            <div>
              <span>Cobrado</span>
              <strong>{pesos(cobrado)}</strong>
              <small>
                {enPeriodo.length} {enPeriodo.length === 1 ? "cita completada" : "citas completadas"}
              </small>
            </div>
            <div>
              <span>Por cobrar</span>
              <strong>{pesos(porCobrar)}</strong>
              <small>
                {citasPorCobrar} {citasPorCobrar === 1 ? "cita agendada" : "citas agendadas"}
              </small>
            </div>
          </div>
        </section>

        <section aria-labelledby="clientes" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 id="clientes" className="etiqueta">Clientes</h2>
          <div className="estadisticas">
            <div>
              <strong>{nuevos}</strong>
              <span>{nuevos === 1 ? "nuevo" : "nuevos"}</span>
            </div>
            <div>
              <strong>{regresan}</strong>
              <span>regresaron</span>
            </div>
            <div>
              <strong>{sinVolver ?? 0}</strong>
              <span>no han regresado</span>
            </div>
          </div>
          <span className="meta">
            Nuevos: su primera visita fue en este periodo. Regresaron: ya habían venido antes. No han regresado: llevan más de 6 semanas sin venir
            {conVisitas ? `, el ${pctSinVolver}% de tus clientes` : ""}.
          </span>
          {(sinVolver ?? 0) > 0 && (
            <Link href="/clientes?ver=volver" className="btn btn-sec">
              Ver a quién escribirle
            </Link>
          )}
        </section>

        {porEstilista.length > 1 && (
          <section aria-labelledby="equipo" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 id="equipo" className="etiqueta">Cobrado por persona</h2>
            <ul className="barras">
              {porEstilista.map((e) => (
                <li key={e.nombre}>
                  <div className="fila-separada">
                    <span>{e.nombre.split(" ")[0]}</span>
                    <strong>{pesos(e.total)}</strong>
                  </div>
                  <span className="barra-valor" style={{ width: `${(e.total / maximo) * 100}%` }} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <BarraBarberia activa="cuenta" />
    </main>
  );
}

function siguienteMes(dia: string): string {
  const [a, m] = dia.split("-").map(Number);
  return m === 12 ? `${a + 1}-01-01` : `${a}-${String(m + 1).padStart(2, "0")}-01`;
}

// Lo que ve una barbería sin Nura Insights: qué incluye y cómo activarlo.
function SinInsights() {
  const whatsapp = process.env.NEXT_PUBLIC_NURA_WHATSAPP;
  return (
    <main className="pantalla">
      <div className="contenido">
        <Link href="/complementos" className="volver">
          <Icono nombre="atras" tamano={18} />
          Complementos
        </Link>
        <div>
          <h1 className="titulo">Nura Insights</h1>
          <p className="subtitulo">Los números de tu barbería, claros cada semana.</p>
        </div>
        <section className="tarjeta" style={{ gap: 12 }}>
          <ul className="lista-incluye">
            {[
              "Cuánto cobraste esta semana, este mes o en 3 meses",
              "Cuánto tienes por cobrar en citas agendadas",
              "Cuántos clientes son nuevos y cuántos regresan",
              "Quién no ha regresado en más de 6 semanas, para escribirle",
              "Cuánto cobra cada persona de tu equipo",
            ].map((t) => (
              <li key={t}>
                <span className="paso hecho">
                  <Icono nombre="check" tamano={14} grosor={2.4} />
                </span>
                {t}
              </li>
            ))}
          </ul>
          <div className="fila-separada" style={{ borderTop: "1px solid var(--borde-100)", paddingTop: 12 }}>
            <span style={{ fontSize: 14, color: "var(--tinta-600)" }}>Al mes</span>
            <span className="precio" style={{ fontSize: 22 }}>{pesos(PRECIO_INSIGHTS)}</span>
          </div>
        </section>
        {whatsapp ? (
          <a className="btn" href={enlaceWhatsApp(whatsapp, "Hola, quiero activar Nura Insights para mi barbería.")} target="_blank" rel="noreferrer">
            Quiero activarlo
          </a>
        ) : (
          <p className="aviso aviso-neutro">Para activarlo, pídeselo al equipo de Nura.</p>
        )}
        <p className="meta" style={{ margin: 0 }}>Solo el encargado de la barbería ve estos números. Tu equipo no.</p>
      </div>
      <BarraBarberia activa="cuenta" />
    </main>
  );
}
