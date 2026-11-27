import { Logo } from "./Logo";

// Se muestra mientras no estén puestas las llaves de Supabase en Vercel.
export function SinConfigurar() {
  return (
    <main className="pantalla">
      <div className="contenido" style={{ justifyContent: "center" }}>
        <Logo alto={40} />
        <h1 className="titulo">Falta conectar la base de datos</h1>
        <p className="subtitulo">
          La app ya está en línea, pero todavía no tiene las llaves de Supabase. Agrégalas en Vercel, en Settings y
          luego Environment Variables, con estos dos nombres:
        </p>
        <div className="tarjeta" style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13 }}>
          <span>NEXT_PUBLIC_SUPABASE_URL</span>
          <span>NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
        </div>
        <p className="meta">Después vuelve a publicar el proyecto en Vercel. La guía completa está en docs/CONFIGURAR.md del repositorio.</p>
      </div>
    </main>
  );
}
