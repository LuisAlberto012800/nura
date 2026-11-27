"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Ventana } from "@/components/Ventana";
import { useFormulario } from "@/lib/useFormulario";
import { duracionTexto, pesos } from "@/lib/formato";
import { aMinutos, diaSemana, etiquetaDia, fechaLarga } from "@/lib/tiempo";
import { horasLibres, turnosDelDia, type Ocupado, type Turno } from "@/lib/disponibilidad";
import { reservarCita, type EstadoReserva } from "./acciones";

type Servicio = { id: string; nombre: string; duracion_min: number; precio: number };
type Estilista = { id: string; nombre: string; horarios: Turno[] };

const EN_PLURAL = ["los domingos", "los lunes", "los martes", "los miércoles", "los jueves", "los viernes", "los sábados"];
const MESES_LARGOS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function FormularioReserva({
  slug,
  salonId,
  servicios,
  equipo,
  ocupados,
  dias,
  hoy,
  ahora,
  servicioInicial,
  estilistaInicial,
  fotos,
  colonia,
}: {
  slug: string;
  salonId: string;
  servicios: Servicio[];
  equipo: Estilista[];
  ocupados: Ocupado[];
  dias: string[];
  hoy: string;
  ahora: number;
  servicioInicial?: string;
  estilistaInicial?: string;
  fotos: Record<string, string>;
  colonia: string;
}) {
  const { estado, enviar, enviando } = useFormulario<EstadoReserva>(reservarCita, {});
  const [servicioId, setServicioId] = useState(servicios.some((s) => s.id === servicioInicial) ? servicioInicial! : "");
  const [estilistaId, setEstilistaId] = useState(equipo.length === 1 ? equipo[0].id : (equipo.find((e) => e.id === estilistaInicial)?.id ?? ""));
  const [dia, setDia] = useState("");
  const [hora, setHora] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [visto, setVisto] = useState<EstadoReserva | null>(null);
  const servicio = servicios.find((s) => s.id === servicioId);
  const [eligiendo, setEligiendo] = useState(!servicio);
  const estilista = equipo.find((e) => e.id === estilistaId);

  const trabaja = (d: string) => !!estilista && turnosDelDia(estilista.horarios, d).length > 0;
  useEffect(() => {
    if (estilista && (!dia || !trabaja(dia))) setDia(dias.find(trabaja) ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estilistaId]);

  const libres = useMemo(() => {
    if (!servicio || !estilista || !dia) return [];
    return horasLibres(estilista.horarios, ocupados, estilista.id, dia, servicio.duracion_min).filter((h) => dia !== hoy || aMinutos(h) >= ahora + 30);
  }, [servicio, estilista, dia, ocupados, hoy, ahora]);
  useEffect(() => {
    if (hora && !libres.includes(hora)) setHora("");
  }, [libres, hora]);

  const tira = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tira.current?.querySelector<HTMLElement>("[aria-pressed='true']")?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [dia]);

  const elegirDia = (d: string) => {
    if (!trabaja(d)) {
      setAviso(`${estilista?.nombre.split(" ")[0]} descansa ${EN_PLURAL[diaSemana(d)]}. Elige otro día.`);
      return;
    }
    setDia(d);
  };

  const mensaje = aviso ?? (estado.error && visto !== estado ? estado.error : null);
  const listo = servicio && estilista && dia && hora;

  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="salon_id" value={salonId} />
      <input type="hidden" name="servicio_id" value={servicioId} />
      <input type="hidden" name="estilista_id" value={estilistaId} />
      <input type="hidden" name="dia" value={dia} />
      <input type="hidden" name="hora" value={hora} />

      {servicio && !eligiendo ? (
        <div className="tarjeta resumen-miniatura">
          <span className="mini">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {fotos[servicio.id] && <img src={fotos[servicio.id]} alt="" />}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 800 }}>{servicio.nombre}</p>
            {estilista && <p style={{ fontSize: 13, color: "var(--tinta-600)", marginTop: 3 }}>Con {estilista.nombre}</p>}
            <p className="meta" style={{ fontSize: 12, marginTop: 3 }}>
              {duracionTexto(servicio.duracion_min)} · {colonia}
            </p>
          </span>
          <button type="button" className="btn-texto" style={{ minHeight: 44, border: 0, background: "none", font: "inherit", fontWeight: 700, cursor: "pointer" }} onClick={() => setEligiendo(true)}>
            Cambiar
          </button>
        </div>
      ) : (
        <section className="tarjeta" aria-labelledby="paso-servicio">
          <h2 id="paso-servicio" className="etiqueta">Servicio</h2>
          <div className="lista-opciones">
            {servicios.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`opcion-fila opcion-servicio${servicioId === s.id ? " activo" : ""}`}
                aria-pressed={servicioId === s.id}
                onClick={() => {
                  setServicioId(s.id);
                  setEligiendo(false);
                }}
              >
                <span>
                  {s.nombre}
                  <small>{duracionTexto(s.duracion_min)}</small>
                </span>
                <strong>{pesos(s.precio)}</strong>
              </button>
            ))}
          </div>
        </section>
      )}

      {servicio && !eligiendo && equipo.length > 1 && (
        <section className="tarjeta" aria-labelledby="paso-quien">
          <h2 id="paso-quien" className="etiqueta">Con quién</h2>
          <div className="chips-equipo">
            {equipo.map((e) => (
              <button key={e.id} type="button" className={`chip${estilistaId === e.id ? " activo" : ""}`} aria-pressed={estilistaId === e.id} onClick={() => setEstilistaId(e.id)}>
                {e.nombre.split(" ")[0]}
              </button>
            ))}
          </div>
        </section>
      )}

      {servicio && !eligiendo && estilista && (
        <section aria-labelledby="paso-cuando" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h2 id="paso-cuando" className="etiqueta">
            {dia ? MESES_LARGOS[Number(dia.slice(5, 7)) - 1] : "Cuándo"}
          </h2>
          <div className="tira-elegir dias-grandes" ref={tira} role="group" aria-label="Elegir día">
            {dias.map((d, i) => {
              const { corto, numero } = etiquetaDia(d);
              const abre = trabaja(d);
              return (
                <button key={d} type="button" className={`dia-chip${d === dia ? " activo" : ""}${abre ? "" : " descansa"}`} aria-pressed={d === dia} onClick={() => elegirDia(d)}>
                  <span>{d === hoy ? "Hoy" : corto}</span>
                  <strong>{numero}</strong>
                  <small>{abre ? (i === 0 || d.slice(8) === "01" ? MESES[Number(d.slice(5, 7)) - 1] : "") : "cerrado"}</small>
                </button>
              );
            })}
          </div>
          {dia &&
            (libres.length > 0 ? (
              <>
              <h3 className="etiqueta" style={{ marginTop: 6 }}>Horarios libres el {fechaLarga(dia).split(",")[0].toLowerCase()}</h3>
              <div className="horas-libres tres" role="group" aria-label="Horas libres">
                {libres.map((h) => (
                  <button key={h} type="button" className={`hora-chip${h === hora ? " activo" : ""}`} aria-pressed={h === hora} onClick={() => setHora(h)}>
                    {h}
                  </button>
                ))}
              </div>
              </>
            ) : (
              <p className="aviso aviso-neutro" style={{ margin: 0 }}>Ya no hay horas libres este día. Prueba otro.</p>
            ))}
        </section>
      )}

      {listo && (
        <section className="tarjeta" aria-label="Precio">
          <div className="desglose">
            <div>
              <span>{servicio.nombre}</span>
              <b>{pesos(servicio.precio)}</b>
            </div>
            <div>
              <span>Cargo por usar Nura</span>
              <b className="cero">$0</b>
            </div>
            <div className="total">
              <span>Total</span>
              <b>{pesos(servicio.precio)}</b>
            </div>
          </div>
          <span className="meta" style={{ fontSize: 12 }}>Precio exacto. Pagas directamente en la barbería.</span>
        </section>
      )}

      {listo && (
        <section className="tarjeta" aria-labelledby="paso-tu">
          <h2 id="paso-tu" className="etiqueta">Tus datos</h2>
          <label className="campo">
            <span>Nombre</span>
            <input name="nombre" autoComplete="name" required />
          </label>
          <label className="campo">
            <span>Celular</span>
            <input name="telefono" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="33 1234 5678" required />
            <small>Para confirmarte por WhatsApp. No necesitas cuenta.</small>
          </label>
        </section>
      )}

      <div className="accion-fija">
        <button className="btn" type="submit" disabled={!listo || enviando}>
          {enviando ? "Apartando…" : listo ? `Confirmar · ${fechaLarga(dia).split(",")[0].toLowerCase()} ${Number(dia.slice(8))}, ${hora}` : !servicio || eligiendo ? "Elige un servicio" : !estilista ? "Elige con quién" : "Elige una hora"}
        </button>
      </div>

      {mensaje && (
        <Ventana
          titulo="No está disponible"
          onCerrar={() => {
            setAviso(null);
            setVisto(estado);
          }}
        >
          <p>{mensaje}</p>
        </Ventana>
      )}
    </form>
  );
}
