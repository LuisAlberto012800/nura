# Nura

Marketplace de trabajo de cabello en Guadalajara: agenda, clientes, portafolio y página pública para barberías y estéticas, y un feed para que las clientas vean trabajos reales cerca de ellas antes de reservar.

**Principio:** el mayor lujo es la información y la transparencia.

## Etapa actual

Validación con barberías reales (fases 0 a 2 del plan de lanzamiento). Se construye primero el lado de la barbería como web app instalable, en planes gratuitos.

## Cómo está armado

| Pieza | Servicio |
| --- | --- |
| Código | Este repositorio |
| Base de datos, cuentas y fotos | Supabase |
| Web app de la barbería y página pública | Vercel |

## Reglas del proyecto

- Las llaves de Supabase y cualquier secreto van solo en las variables de entorno de Vercel. Nunca se suben a este repositorio.
- Cada barbería ve únicamente sus propios datos.
- Precios exactos en pesos, nunca "desde".
- La app nunca segmenta por género.
