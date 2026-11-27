// Se muestra al instante mientras llega la siguiente pantalla, para que la app
// se sienta inmediata aunque los datos tarden un momento.
export default function Cargando() {
  return (
    <main className="pantalla" aria-busy="true" aria-label="Cargando">
      <div className="contenido">
        <span className="esqueleto" style={{ width: "55%", height: 32 }} />
        <span className="esqueleto" style={{ width: "35%", height: 16 }} />
        <span className="esqueleto" style={{ height: 120, borderRadius: 20 }} />
        <span className="esqueleto" style={{ height: 72, borderRadius: 20 }} />
        <span className="esqueleto" style={{ height: 72, borderRadius: 20 }} />
      </div>
    </main>
  );
}
