// Envío de mensajes por la API oficial de WhatsApp (Meta Cloud API).
// Las llaves viven en Vercel como variables de entorno, nunca en el código.

const API = process.env.WHATSAPP_API_URL ?? "https://graph.facebook.com/v21.0";

export type Fila = { id: string; title: string; description?: string };
export type Boton = { id: string; title: string };

const corta = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

async function mandar(cuerpo: Record<string, unknown>) {
  const token = process.env.WHATSAPP_TOKEN;
  const telefono = process.env.WHATSAPP_PHONE_ID;
  if (!token || !telefono) return;
  await fetch(`${API}/${telefono}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...cuerpo }),
  }).catch(() => {});
}

export const enviarTexto = (para: string, texto: string) => mandar({ to: para, type: "text", text: { body: corta(texto, 4000), preview_url: true } });

// Lista con hasta 10 opciones (WhatsApp no permite más).
export const enviarLista = (para: string, texto: string, boton: string, filas: Fila[]) =>
  mandar({
    to: para,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: corta(texto, 1024) },
      action: {
        button: corta(boton, 20),
        sections: [{ title: "Opciones", rows: filas.slice(0, 10).map((f) => ({ id: f.id, title: corta(f.title, 24), ...(f.description ? { description: corta(f.description, 72) } : {}) })) }],
      },
    },
  });

// Hasta 3 botones.
export const enviarBotones = (para: string, texto: string, botones: Boton[]) =>
  mandar({
    to: para,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: corta(texto, 1024) },
      action: { buttons: botones.slice(0, 3).map((b) => ({ type: "reply", reply: { id: b.id, title: corta(b.title, 20) } })) },
    },
  });
