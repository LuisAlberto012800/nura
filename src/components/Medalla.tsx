import { NOMBRE_MEDALLA } from "@/lib/medallas";

// Sello de verificación: palomita azul, de una a cuatro cuentas y el nombre.
// Sin colores metálicos: el azul es el que orienta.
export function Medalla({ nivel, compacta = false }: { nivel: number; compacta?: boolean }) {
  if (nivel <= 0) return compacta ? null : <span className="medalla sin">Sin verificar</span>;
  return (
    <span className="medalla" aria-label={`Medalla ${NOMBRE_MEDALLA[nivel]}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="var(--azul-500)" />
        <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="cuentas" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <i key={i} className={i <= nivel ? "llena" : undefined} />
        ))}
      </span>
      {!compacta && <span>{NOMBRE_MEDALLA[nivel]}</span>}
    </span>
  );
}
