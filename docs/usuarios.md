# Cuentas de usuario, idoneidad y seguimiento

## Arquitectura
- **Auth**: Supabase Auth (correo + contraseña, enlace mágico, recuperación) con `@supabase/ssr` y cookies. `src/proxy.ts` refresca la sesión y protege `/mi/*`.
- **Datos del usuario**: consultas directas a Postgres dentro de una transacción con `set local role authenticated` y `request.jwt.claims`, así que **RLS se aplica de verdad** (`src/lib/usuario.ts → conUsuario`).
- **Migración**: `supabase/migrations/20261118000300_usuarios.sql` (tablas, RLS, triggers e `idoneidad()`). En un Postgres local sin Supabase, ejecuta antes `supabase/local/shim_auth.sql`.

## Estados de un seguimiento
`interesa → preparando → presentada → ganada | perdida`, más `descartada` (con motivo) y `desierta` (anulada/desierta/desistimiento/renuncia).
- Cada cambio queda en `seguimiento_eventos` (trigger), marcando si fue automático.
- Automáticos: licitación `Anulada` o resultado desierto/desistimiento/renuncia → `desierta`; adjudicación al CIF del perfil → `ganada`.
- Al crear un seguimiento se añade un checklist por defecto (DEUC, solvencia económica y técnica, garantía, sobres B y C).

## Idoneidad (0–100) — `public.idoneidad(p_ids uuid[], p_limite int)`
| Criterio | Puntos | Detalle |
|---|---|---|
| CPV | 30 | Prefijo del perfil coincide: 8 díg. 30 · 5–7 27 · 4 24 · 3 21 · 2 18; CPV de la licitación más general que el del perfil 15 |
| Palabras clave | 20 | 12 + 4 por cada palabra extra encontrada en el objeto |
| Importe | 15 | Presupuesto dentro de [mín, máx] |
| Tipo | 10 | Tipo de contrato elegido |
| Organismo | 10 | Organismo preferido |
| Plazo | 10 | Quedan ≥ días de preparación (proporcional si menos) |
| Zona | 5 | Municipio/zona en organismo, lugar u objeto; organismos autonómicos y «Toda La Rioja» cuentan siempre |

Un criterio sin configurar aporta la mitad (neutral). Penalizaciones: palabra excluida −25, organismo excluido −40, importe > facturación −15, 1,5 × valor anual > facturación −5, procedimiento no preferido −5. Bonus: ya ganaste con ese organismo (+10). Resultado acotado a 0–100, con el desglose «por qué encaja / por qué no».

## Alertas por correo
Preferencias en `perfiles.alertas_*` y cola en `alertas_email`. **No se envían todavía.**
