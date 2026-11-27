# Nura · instrucciones del proyecto

Marketplace de trabajo de cabello en Guadalajara. Etapa actual: el lado de la barbería como web app instalable, en planes gratuitos (Supabase Free, Vercel Hobby), para validar con barberías reales.

## Stack

- Next.js 15 (App Router) con TypeScript, CSS propio en `src/app/globals.css` (sin Tailwind).
- Supabase para base de datos, cuentas y fotos, con `@supabase/ssr`. Solo la llave pública (anon o publishable); nunca `service_role` en el código.
- La base de datos vive en `supabase/migrations/`. Cada cambio de esquema es un archivo nuevo numerado (`0002_...sql`), nunca se edita uno ya corrido.

## Reglas que no se rompen

- Cada barbería ve y cambia solo sus datos: toda tabla nueva lleva `salon_id`, RLS activado y políticas con `es_miembro(salon_id)`. Clientes, citas y bloqueos nunca son públicos.
- Precios exactos en pesos enteros, nunca "desde".
- Nunca segmentar por género, en nada.
- Un trabajo no se publica sin foto de después, tipo de cabello, servicio, duración y colonia.
- Terracota (`--accion-500`) es acción; azul (`--azul-500`) es orientación, solo en detalles. Nunca un botón azul.
- Tipografía Plus Jakarta Sans, empaquetada en `src/app/fonts`. El logotipo es el componente `Logo`, nunca texto.
- Textos de la interfaz en español de México, de tú, sin emojis, con el dato por delante.
- El usuario no es programador: explicaciones en español sencillo, y las llaves nunca se piden en el chat.

## Orden de construcción

Alta en 4 pasos, servicios y equipo con horarios, agenda sin empalmes, clientes e importador, subir trabajo, página pública con reserva, Hoy y medallas. La guía para poner la app en línea está en `docs/CONFIGURAR.md`.
