"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Icono } from "@/components/Iconos";
import { adivinarColumnas, CAMPOS, leerCSV, leerFecha, leerTexto, type Campo } from "@/lib/csv";
import { importarLote, type FilaImportar } from "./acciones";

const MAXIMO = 5000;
const LOTE = 200;

const soloDigitos = (t: string) => {
  let d = t.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("52")) d = d.slice(2);
  if (d.length === 13 && d.startsWith("521")) d = d.slice(3);
  return d;
};

type Paso = "elegir" | "revisar" | "importando" | "listo";

export function Importador() {
  const [paso, setPaso] = useState<Paso>("elegir");
  const [archivo, setArchivo] = useState("");
  const [encabezados, setEncabezados] = useState<string[]>([]);
  const [filas, setFilas] = useState<string[][]>([]);
  const [columnas, setColumnas] = useState<Record<Campo, number> | null>(null);
  const [permiso, setPermiso] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avance, setAvance] = useState(0);
  const [resultado, setResultado] = useState({ nuevos: 0, repetidos: 0, omitidos: 0 });
  const entrada = useRef<HTMLInputElement>(null);

  const elegir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setError(null);
    if (/\.xlsx?$/i.test(f.name)) return setError("Ese es un archivo de Excel. Ábrelo en Excel y guárdalo como CSV (Archivo, Guardar como, CSV UTF-8).");
    if (f.size > 5 * 1024 * 1024) return setError("El archivo pesa más de 5 MB. Divídelo en dos.");
    const tabla = leerCSV(await leerTexto(f));
    if (tabla.length < 2) return setError("No encontramos clientes en el archivo. Revisa que la primera fila tenga los títulos de las columnas.");
    if (tabla.length - 1 > MAXIMO) return setError(`El archivo tiene más de ${MAXIMO.toLocaleString("es-MX")} clientes. Divídelo en partes.`);
    const cols = adivinarColumnas(tabla[0]);
    setArchivo(f.name);
    setEncabezados(tabla[0]);
    setFilas(tabla.slice(1));
    setColumnas(cols);
    setPaso("revisar");
  };

  // Cómo queda cada fila con las columnas elegidas.
  const listas: FilaImportar[] = useMemo(() => {
    if (!columnas) return [];
    const v = (f: string[], c: Campo) => (columnas[c] >= 0 ? (f[columnas[c]] ?? "").trim() : "");
    return filas.map((f) => ({
      nombre: [v(f, "nombre"), v(f, "apellido")].filter(Boolean).join(" "),
      telefono: soloDigitos(v(f, "telefono")),
      correo: v(f, "correo"),
      notas: v(f, "notas"),
      ultima: leerFecha(v(f, "ultima")) ?? "",
    }));
  }, [filas, columnas]);

  const resumen = useMemo(() => {
    const sinNombre = listas.filter((f) => !f.nombre).length;
    const conCelular = listas.filter((f) => f.nombre && f.telefono.length === 10);
    const repetidosArchivo = conCelular.length - new Set(conCelular.map((f) => f.telefono)).size;
    const celularRaro = listas.filter((f) => f.nombre && f.telefono && f.telefono.length !== 10).length;
    return { total: listas.length - sinNombre, sinNombre, conCelular: conCelular.length, repetidosArchivo, celularRaro };
  }, [listas]);

  const importar = async () => {
    setPaso("importando");
    setError(null);
    const validas = listas.filter((f) => f.nombre);
    const suma = { nuevos: 0, repetidos: 0, omitidos: 0 };
    for (let i = 0; i < validas.length; i += LOTE) {
      const r = await importarLote(validas.slice(i, i + LOTE));
      if (r.error) {
        setError(`${r.error} Se guardaron ${suma.nuevos} antes del error; si vuelves a subir el archivo, los que ya están no se repiten.`);
        setResultado(suma);
        setPaso("listo");
        return;
      }
      suma.nuevos += r.nuevos;
      suma.repetidos += r.repetidos;
      suma.omitidos += r.omitidos;
      setAvance(Math.min(validas.length, i + LOTE) / validas.length);
    }
    suma.omitidos += resumen.sinNombre;
    setResultado(suma);
    setPaso("listo");
  };

  const plantilla = () => {
    const texto = "Nombre,Apellido,Celular,Correo,Notas,Última visita\nAna,Gutiérrez,33 1234 5678,ana@correo.com,Degradado bajo,15/10/2026\n";
    const url = URL.createObjectURL(new Blob(["﻿" + texto], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-clientes-nura.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (paso === "elegir")
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <button type="button" className="foto-subir principal archivo-subir" onClick={() => entrada.current?.click()}>
          <Icono nombre="compartir" tamano={30} />
          <strong>Elige tu archivo CSV</strong>
          <span>Desde tu otra agenda, Excel o Google Sheets</span>
        </button>
        <input ref={entrada} type="file" accept=".csv,text/csv,.txt" hidden onChange={elegir} />
        {error && <p className="aviso aviso-error" role="alert">{error}</p>}
        <section className="tarjeta" style={{ gap: 6 }}>
          <strong>Cómo sacar tu archivo</strong>
          <span className="meta">En tu agenda actual busca Clientes y la opción Exportar o Descargar. Si están en Excel, usa Guardar como, CSV UTF-8.</span>
          <span className="meta">Basta con el nombre. El celular sirve para que no se repitan y para escribirles por WhatsApp.</span>
          <button type="button" className="btn btn-texto" style={{ alignSelf: "flex-start", paddingLeft: 0 }} onClick={plantilla}>
            Descargar plantilla
          </button>
        </section>
      </div>
    );

  if (paso === "revisar" && columnas)
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <section className="tarjeta" aria-labelledby="columnas">
          <div className="fila-separada">
            <h2 id="columnas" className="etiqueta">Columnas</h2>
            <span className="meta">{archivo}</span>
          </div>
          <span className="meta">Revisa que cada dato venga de la columna correcta. Solo el nombre es obligatorio.</span>
          <div className="mapa-columnas">
            {CAMPOS.map((c) => (
              <label key={c.clave} className="campo">
                <span>{c.texto}</span>
                <select value={columnas[c.clave]} onChange={(e) => setColumnas({ ...columnas, [c.clave]: Number(e.target.value) })}>
                  <option value={-1}>No tengo este dato</option>
                  {encabezados.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `Columna ${i + 1}`}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </section>

        <section className="tarjeta" aria-labelledby="vista">
          <h2 id="vista" className="etiqueta">Así se van a ver</h2>
          <ul className="lista-vista">
            {listas.filter((f) => f.nombre).slice(0, 4).map((f, i) => (
              <li key={i}>
                <strong>{f.nombre}</strong>
                <span className="meta">
                  {[f.telefono.length === 10 ? `${f.telefono.slice(0, 2)} ${f.telefono.slice(2, 6)} ${f.telefono.slice(6)}` : "Sin celular", f.ultima ? `vino el ${f.ultima.split("-").reverse().join("/")}` : null, f.notas || null]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </li>
            ))}
          </ul>
          <div className="cifras">
            <div>
              <strong>{resumen.total.toLocaleString("es-MX")}</strong>
              <span>clientes</span>
            </div>
            <div>
              <strong>{resumen.conCelular.toLocaleString("es-MX")}</strong>
              <span>con celular</span>
            </div>
          </div>
          {(resumen.sinNombre > 0 || resumen.repetidosArchivo > 0 || resumen.celularRaro > 0) && (
            <span className="meta">
              {[
                resumen.sinNombre ? (resumen.sinNombre === 1 ? "1 fila sin nombre se salta" : `${resumen.sinNombre} filas sin nombre se saltan`) : null,
                resumen.repetidosArchivo ? (resumen.repetidosArchivo === 1 ? "1 celular repetido se guarda una sola vez" : `${resumen.repetidosArchivo} celulares repetidos se guardan una sola vez`) : null,
                resumen.celularRaro ? (resumen.celularRaro === 1 ? "1 celular no tiene 10 dígitos y ese cliente se guarda sin celular" : `${resumen.celularRaro} celulares no tienen 10 dígitos y esos clientes se guardan sin celular`) : null,
              ]
                .filter(Boolean)
                .join(". ")}
              .
            </span>
          )}
        </section>

        <label className="fila permiso">
          <input type="checkbox" checked={permiso} onChange={(e) => setPermiso(e.target.checked)} />
          <span>Estos clientes me dieron sus datos y les puedo escribir sobre sus citas.</span>
        </label>

        {error && <p className="aviso aviso-error" role="alert">{error}</p>}

        <div className="accion-fija">
          <button type="button" className="btn" disabled={!permiso || resumen.total === 0 || columnas.nombre < 0} onClick={importar}>
            {columnas.nombre < 0 ? "Elige la columna del nombre" : `Importar ${resumen.total.toLocaleString("es-MX")} clientes`}
          </button>
          <button type="button" className="btn btn-texto ancho" style={{ color: "var(--tinta-600)" }} onClick={() => setPaso("elegir")}>
            Elegir otro archivo
          </button>
        </div>
      </div>
    );

  if (paso === "importando")
    return (
      <div className="tarjeta vacio">
        <strong>Importando clientes…</strong>
        <div className="barra-avance" role="progressbar" aria-valuenow={Math.round(avance * 100)} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${Math.max(4, avance * 100)}%` }} />
        </div>
        <p>No cierres esta pantalla. Tarda unos segundos.</p>
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="tarjeta vacio">
        <span className="listo-check" aria-hidden="true">
          <Icono nombre="check" tamano={28} grosor={2.6} />
        </span>
        <strong>{resultado.nuevos.toLocaleString("es-MX")} clientes nuevos</strong>
        <p>
          {[
            resultado.repetidos ? (resultado.repetidos === 1 ? "1 ya estaba en tu lista y no se repitió" : `${resultado.repetidos} ya estaban en tu lista y no se repitieron`) : null,
            resultado.omitidos ? (resultado.omitidos === 1 ? "1 fila se saltó" : `${resultado.omitidos} filas se saltaron`) : null,
          ]
            .filter(Boolean)
            .join(". ") || "Todos quedaron en tu lista como clientes previos."}
        </p>
      </div>
      {error && <p className="aviso aviso-error" role="alert">{error}</p>}
      <Link className="btn" href="/clientes">
        Ver mis clientes
      </Link>
    </div>
  );
}
