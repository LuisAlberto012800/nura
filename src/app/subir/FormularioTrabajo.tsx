"use client";

import { useRef, useState, useTransition, useActionState } from "react";
import { Icono } from "@/components/Iconos";
import { CABELLOS, duracionTexto, pesos } from "@/lib/formato";
import { reducirFoto } from "@/lib/imagen";
import { crearClienteNavegador } from "@/lib/supabase/navegador";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { crearTrabajo, type EstadoTrabajo } from "./acciones";

type Servicio = { id: string; nombre: string; duracion_min: number; precio: number };
type Opcion = { id: string; nombre: string };
export type CitaReciente = {
  id: string;
  etiqueta: string;
  servicio_id: string | null;
  estilista_id: string;
  cliente_nombre: string | null;
  cliente_cabello: string | null;
};

type Foto = { archivo: File; vista: string };

export function FormularioTrabajo({
  salonId,
  colonia: coloniaSalon,
  servicios,
  equipo,
  citas,
  citaInicial,
  estilistaPropio,
}: {
  salonId: string;
  colonia: string;
  servicios: Servicio[];
  equipo: Opcion[];
  citas: CitaReciente[];
  citaInicial?: string;
  estilistaPropio?: string;
}) {
  const [estado, despachar, pendiente] = useActionState<EstadoTrabajo, FormData>(crearTrabajo, {});
  const [enTransicion, iniciar] = useTransition();
  const inicial = citas.find((c) => c.id === citaInicial);

  const [despues, setDespues] = useState<Foto | null>(null);
  const [antes, setAntes] = useState<Foto | null>(null);
  const [citaId, setCitaId] = useState(inicial?.id ?? "");
  const [servicioId, setServicioId] = useState(inicial?.servicio_id ?? servicios[0]?.id ?? "");
  const [estilistaId, setEstilistaId] = useState(inicial?.estilista_id ?? estilistaPropio ?? equipo[0]?.id ?? "");
  const [cabello, setCabello] = useState(inicial?.cliente_cabello ?? "");
  const [colonia, setColonia] = useState(coloniaSalon);
  const [cara, setCara] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const entradaDespues = useRef<HTMLInputElement>(null);
  const entradaAntes = useRef<HTMLInputElement>(null);

  const servicio = servicios.find((s) => s.id === servicioId);
  const cita = citas.find((c) => c.id === citaId);

  const elegirCita = (id: string) => {
    setCitaId(id);
    const c = citas.find((x) => x.id === id);
    if (!c) return;
    if (c.servicio_id && servicios.some((s) => s.id === c.servicio_id)) setServicioId(c.servicio_id);
    setEstilistaId(c.estilista_id);
    if (c.cliente_cabello) setCabello(c.cliente_cabello);
  };

  const tomarFoto = (e: React.ChangeEvent<HTMLInputElement>, guardar: (f: Foto | null) => void) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    guardar({ archivo, vista: URL.createObjectURL(archivo) });
  };

  const subir = async (foto: Foto) => {
    const supabase = crearClienteNavegador();
    const cuerpo = await reducirFoto(foto.archivo);
    const ruta = `${salonId}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage.from("trabajos").upload(ruta, cuerpo, { contentType: "image/jpeg", cacheControl: "31536000" });
    if (error) throw error;
    return `${SUPABASE_URL}/storage/v1/object/public/trabajos/${ruta}`;
  };

  const faltante = !despues ? "Agrega la foto de después" : !servicio ? "Elige el servicio" : !cabello ? "Elige el tipo de cabello" : colonia.trim().length < 2 ? "Escribe la colonia" : null;

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (faltante || !despues) return;
    setErrorLocal(null);
    setSubiendo(true);
    try {
      const datos = new FormData(e.currentTarget);
      datos.set("foto_despues", await subir(despues));
      if (antes) datos.set("foto_antes", await subir(antes));
      iniciar(() => despachar(datos));
    } catch {
      setErrorLocal("No se pudo subir la foto. Revisa tu internet e intenta de nuevo.");
    } finally {
      setSubiendo(false);
    }
  };

  const ocupado = subiendo || pendiente || enTransicion;
  const error = errorLocal ?? estado.error;

  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <input type="hidden" name="cita_id" value={citaId} />
      <input type="hidden" name="servicio_id" value={servicioId} />
      <input type="hidden" name="estilista_id" value={estilistaId} />
      <input type="hidden" name="tipo_cabello" value={cabello} />
      <input type="hidden" name="muestra_cara" value={cara ? "si" : "no"} />

      <div className="fotos-subir">
        <button type="button" className={`foto-subir principal${despues ? " con-foto" : ""}`} onClick={() => entradaDespues.current?.click()}>
          {despues ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={despues.vista} alt="Foto de después" />
          ) : (
            <>
              <Icono nombre="camara" tamano={30} />
              <strong>Foto de después</strong>
              <span>Toca para tomarla o elegirla</span>
            </>
          )}
        </button>
        <button type="button" className={`foto-subir${antes ? " con-foto" : ""}`} onClick={() => entradaAntes.current?.click()}>
          {antes ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={antes.vista} alt="Foto de antes" />
          ) : (
            <>
              <Icono nombre="mas" tamano={22} />
              <span>Antes</span>
              <small>opcional</small>
            </>
          )}
        </button>
        <input ref={entradaDespues} type="file" accept="image/*" hidden onChange={(e) => tomarFoto(e, setDespues)} />
        <input ref={entradaAntes} type="file" accept="image/*" hidden onChange={(e) => tomarFoto(e, setAntes)} />
      </div>

      {citas.length > 0 && (
        <section className="tarjeta" aria-labelledby="de-que-cita">
          <h2 id="de-que-cita" className="etiqueta">¿De qué cita?</h2>
          <div className="lista-opciones">
            {citas.map((c) => (
              <button key={c.id} type="button" className={`opcion-fila${citaId === c.id ? " activo" : ""}`} aria-pressed={citaId === c.id} onClick={() => elegirCita(c.id)}>
                {c.etiqueta}
              </button>
            ))}
            <button type="button" className={`opcion-fila${!citaId ? " activo" : ""}`} aria-pressed={!citaId} onClick={() => setCitaId("")}>
              Sin cita
            </button>
          </div>
          {cita?.cliente_nombre && (
            <p className="meta" style={{ margin: 0 }}>Le pediremos a {cita.cliente_nombre.split(" ")[0]} que confirme el trabajo. Eso le da su medalla.</p>
          )}
        </section>
      )}

      <section className="tarjeta" aria-labelledby="datos-trabajo">
        <h2 id="datos-trabajo" className="etiqueta">Datos</h2>
        <label className="campo">
          <span>Servicio</span>
          <select value={servicioId} onChange={(e) => setServicioId(e.target.value)}>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} · {duracionTexto(s.duracion_min)} · {pesos(s.precio)}
              </option>
            ))}
          </select>
        </label>
        <div className="campo">
          <span>Tipo de cabello</span>
          <div className="opciones-cabello cuatro">
            {CABELLOS.map((c) => (
              <button key={c.valor} type="button" className={`opcion-cabello${cabello === c.valor ? " activo" : ""}`} aria-pressed={cabello === c.valor} onClick={() => setCabello(c.valor)}>
                <strong>{c.texto}</strong>
              </button>
            ))}
          </div>
        </div>
        {equipo.length > 1 && (
          <div className="campo">
            <span>Lo hizo</span>
            <div className="chips-equipo">
              {equipo.map((e) => (
                <button key={e.id} type="button" className={`chip${estilistaId === e.id ? " activo" : ""}`} aria-pressed={estilistaId === e.id} onClick={() => setEstilistaId(e.id)}>
                  {e.nombre.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        )}
        <label className="campo">
          <span>Colonia</span>
          <input name="colonia" value={colonia} onChange={(e) => setColonia(e.target.value)} />
        </label>
        <label className="fila-separada interruptor-fila">
          <span>
            <strong>Se ve la cara</strong>
            <small>Se publica cuando tu cliente lo confirme.</small>
          </span>
          <input type="checkbox" className="interruptor-check" checked={cara} onChange={(e) => setCara(e.target.checked)} />
        </label>
      </section>

      {error && <p className="aviso aviso-error" role="alert">{error}</p>}

      <div className="accion-fija">
        <button className="btn" type="submit" disabled={ocupado || !!faltante}>
          {subiendo ? "Subiendo foto…" : ocupado ? "Guardando…" : faltante ?? (cara ? "Guardar" : "Publicar")}
        </button>
      </div>
    </form>
  );
}
