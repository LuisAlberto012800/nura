"use client";

import { useEffect, useRef, useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/navegador";
import { iniciarChat } from "@/app/mensajes/acciones";

export type Mensaje = { id: string; autor: "cliente" | "salon"; texto: string; creado_en: string };

const hora = (iso: string) => new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));

// Conversación en vivo. Los mensajes nuevos llegan solos (Supabase Realtime) y,
// por si la conexión falla, se revisa cada 20 segundos.
export function Hilo({
  conversacionId,
  salonId,
  yo,
  iniciales,
  puedeEscribir,
  avisoCerrado,
}: {
  conversacionId: string | null;
  salonId: string;
  yo: "cliente" | "salon";
  iniciales: Mensaje[];
  puedeEscribir: boolean;
  avisoCerrado?: string;
}) {
  const [conv, setConv] = useState(conversacionId);
  const [mensajes, setMensajes] = useState(iniciales);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fondo = useRef<HTMLDivElement>(null);

  const agregar = (nuevos: Mensaje[]) =>
    setMensajes((m) => {
      const ids = new Set(m.map((x) => x.id));
      const juntos = [...m, ...nuevos.filter((x) => !ids.has(x.id))];
      return juntos.sort((a, b) => a.creado_en.localeCompare(b.creado_en));
    });

  useEffect(() => {
    if (!conv) return;
    const supabase = crearClienteNavegador();
    supabase.rpc("marcar_leido", { p_conversacion: conv });
    const canal = supabase
      .channel(`conversacion-${conv}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensajes", filter: `conversacion_id=eq.${conv}` }, (p) => {
        agregar([p.new as Mensaje]);
        supabase.rpc("marcar_leido", { p_conversacion: conv });
      })
      .subscribe();
    const reloj = setInterval(async () => {
      const { data } = await supabase.from("mensajes").select("id, autor, texto, creado_en").eq("conversacion_id", conv).order("creado_en", { ascending: false }).limit(30);
      if (data) agregar(data as Mensaje[]);
    }, 20000);
    return () => {
      clearInterval(reloj);
      supabase.removeChannel(canal);
    };
  }, [conv]);

  useEffect(() => {
    fondo.current?.scrollIntoView({ block: "end" });
  }, [mensajes.length]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const limpio = texto.trim();
    if (!limpio || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      if (!conv) {
        const r = await iniciarChat(salonId, limpio);
        if (r.error || !r.id) throw new Error(r.error);
        setConv(r.id);
        agregar([{ id: `local-${Date.now()}`, autor: yo, texto: limpio, creado_en: new Date().toISOString() }]);
      } else {
        const { data, error: err } = await crearClienteNavegador()
          .from("mensajes")
          .insert({ salon_id: salonId, conversacion_id: conv, autor: yo, texto: limpio })
          .select("id, autor, texto, creado_en")
          .single();
        if (err || !data) throw new Error(yo === "cliente" ? "El chat de esta barbería está cerrado en este momento." : "No se pudo mandar. Intenta de nuevo.");
        agregar([data as Mensaje]);
      }
      setTexto("");
    } catch (x) {
      setError(x instanceof Error && x.message ? x.message : "No se pudo mandar. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="hilo">
      <div className="hilo-mensajes" aria-live="polite">
        {mensajes.length === 0 && <p className="meta" style={{ textAlign: "center", margin: "24px 0" }}>Escribe tu pregunta. Te contesta alguien del equipo.</p>}
        {mensajes.map((m) => (
          <div key={m.id} className={`burbuja ${m.autor === yo ? "mia" : "suya"}`}>
            <p>{m.texto}</p>
            <span>{hora(m.creado_en)}</span>
          </div>
        ))}
        <div ref={fondo} />
      </div>
      {error && <p className="aviso aviso-error" role="alert" style={{ margin: 0 }}>{error}</p>}
      {puedeEscribir ? (
        <form className="hilo-escribir" onSubmit={enviar}>
          <label className="sr-only" htmlFor="mensaje">Mensaje</label>
          <textarea id="mensaje" rows={1} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe un mensaje" maxLength={1000}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement).requestSubmit(); } }} />
          <button type="submit" className="btn" disabled={enviando || !texto.trim()} aria-label="Mandar">
            Mandar
          </button>
        </form>
      ) : (
        <p className="aviso aviso-neutro" style={{ margin: 0 }}>{avisoCerrado}</p>
      )}
    </div>
  );
}
