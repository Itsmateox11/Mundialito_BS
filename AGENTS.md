# AGENTS.md

## Stack
- Next.js 14 (App Router, RSC, Server Actions), TypeScript strict, Prisma 5 + SQLite (`prisma/dev.db`, `file:./dev.db`), Tailwind + primitivas estilo shadcn/ui (Radix Slot/cva), vitest, ESLint `next/core-web-vitals`.
- Alias de rutas `@/*` -> raíz del repositorio.
- Tipografías: los tres alias de Tailwind (`font-display`, `font-sans`, `font-narrow`) resuelven a League Spartan vía `next/font/google` (`--font-league-spartan`). La sección de tipografías del README (Archivo/Public Sans) está desactualizada.
- `prisma generate` se ejecuta en `postinstall`. Todo es local (SQLite); sin servicios externos.

## Comandos
```bash
npm install          # instala + prisma generate
cp .env.example .env
npm run db:migrate   # prisma migrate dev
npm run db:seed      # siembra torneo + cuentas demo (borra y recrea datos)
npm run dev
npm run lint
npm run typecheck     # tsc --noEmit
npm test              # vitest run (node); no necesita base de datos ni navegador
npm run test:watch
npx vitest run tests/permissions.test.ts   # ejecutar una sola suite
npm run verify        # lint && typecheck && test && build (igual que CI)
npm run db:reset      # prisma migrate reset --force
npm run db:studio
```
- CI (`.github/workflows/ci.yml`): Node 20, `npm ci`, `npx prisma migrate deploy`, luego lint/typecheck/test/build con `DATABASE_URL=file:./ci.db`. Define `DATABASE_URL` en `.env` antes de los comandos de base de datos local; la ruta es relativa a `prisma/`.
- `npm run build`/`npm run verify` también consultan la base: `deportes/[slug]` ejecuta `generateStaticParams()` en el build. Migra y siembra antes de compilar en local.
- `prisma/*.db` está en `.gitignore`; nunca confirmar archivos de base de datos. `.env` sí está versionado en este repo: no metas secretos reales.

## Base de datos/esquema (SQLite)
- Sin enums ni arrays en el esquema: los estados viven en `lib/domain.ts` (usar esas constantes, no literales de texto); las listas son JSON en texto (p. ej. `Sport.requirements`).
- Roles `ESTUDIANTE|DOCENTE|INVITADO`. `User.passwordHash` es nulo para la cuenta invitado. `Session` guarda caducidad según el rol.
- `MatchEvent` es `GOL|AMARILLA|ROJA`; solo `GOL` cambia estadísticas/tabla de goleadores. Los deportes de gol son exactamente `microfutbol` y `balon-mano` (`GOAL_SPORTS`); ojo: el slug es `microfutbol` aunque la interfaz lo llame "Futsal". Sus marcadores se derivan de los eventos y se cierran desde los goles; el resto usa marcador manual/`scoreNote`.
- Los campos de clasificación de `Team` (`played/won/drawn/lost/goalsFor/goalsAgainst/form`) se guardan y actualizan solo mediante `scoreOperations` en `app/(panel)/admin/partidos/actions.ts`. No mutar la clasificación en otro sitio; los puntos se calculan 3/1/0 en `lib/domain.ts`.
- `Enrollment` es único por usuario+deporte. El cupo cuenta solo `APROBADA`; las solicitudes pendientes igualmente comprueban cupo libre. `OPEN_STATUSES` son las que esperan decisión docente.
- `SemilleroEnrollment` es independiente de la inscripción al Mundialito: `INSCRITO|CANCELADO`, reinscribirse reactiva la fila y el cupo se controla dentro de una transacción.
- `Classroom` (opcional en `Team`) asocia un salón a un país; la bandera se deriva de `countryCode` en `lib/countries.ts`.
- `News` puede referenciar un `Match` o un `Player`; al borrarlos la referencia queda nula y la tarjeta cae a anuncio simple. Los anuncios de "Próximo partido" se crean/retiran en la misma transacción que el partido mediante `lib/announcements.ts`: reutiliza esos helpers al tocar partidos.

## Autenticación/permisos (crítico)
- Las capacidades están en `lib/permissions.ts` (puro). `INVITADO` solo `VIEW_PUBLIC`. `ESTUDIANTE` tiene capacidades de miembro+deportista. `DOCENTE` tiene capacidades de miembro+todas las de administración, pero ninguna de deportista. `HOME_BY_ROLE`: docente→`/admin`, estudiante→`/dashboard`, invitado→`/deportes`. Añadir roles/capacidades ahí, no con comprobaciones de rol dispersas por las páginas.
- Guardas: `requireUser()`→`/login`, `requireCapability()`→`homeFor()`, `authorize()` lanza `NotAuthorizedError` en acciones de servidor. El layout `(panel)` exige sesión y el de admin exige admin, pero cada página/acción se protege igualmente. Filtrar el menú es cortesía, no seguridad.
- Sesiones: caducidad según rol (docente 1d, estudiante 7d, invitado 1d), httpOnly/sameSite=lax/secure en producción; las caducadas se barren al iniciar sesión. Cambiar el rol borra todas las sesiones del usuario.
- Contraseñas: `scrypt` de Node (`scrypt$N$r$p$salt$hash`), `normalize("NFKC")`, comparación en tiempo constante.
- Rate limit (`lib/rate-limit.ts`): en memoria por `origin|email` (x-forwarded-for/x-real-ip), 5 fallos/15min → bloqueo de 10min, se limpia al acertar. Comprobar+reservar antes de verificar la contraseña.
- Login: la ventana elegida debe coincidir con el rol guardado (en servidor). El registro público siempre crea `ESTUDIANTE`, exige exactamente `@colsantander.edu.co` y acepta un deporte o `"none"`. El acceso invitado usa el usuario `INVITADO` sembrado.
- `NEXT_PUBLIC_DEMO_AUTOFILL` viene activo y rellena credenciales demo (incluido admin). Ponerlo en `off` antes de cualquier despliegue público.

## Arquitectura
- `app/(panel)/layout.tsx` llama a `requireUser()`; las páginas viven en `app/(panel)/...` y los módulos de admin en `/admin/*`. `app/(panel)/deportes/[slug]/page.tsx` usa `generateStaticParams()`; `/api/buscar` es `force-dynamic`.
- Las acciones de servidor viven junto a sus rutas con `"use server"`, llaman a `authorize(...)` (salvo login/registro, que son públicos) y después a `revalidatePath(...)` para cada vista afectada. Cuando cambia un resultado/gol, reutilizar los helpers existentes en `admin/partidos/actions.ts` para que clasificación y goleadores sigan cuadrando.
- Los filtros viven en la URL, se validan contra opciones reales en `lib/filters.ts` y el filtrado en sí es puro (testeable). La comparación de texto (`lib/text.ts`) quita diacríticos porque SQLite solo pliega ASCII.
- La búsqueda global vive en `lib/search.ts` (`server-only`) y la comparten `/buscar` y `/api/buscar`; la API devuelve 401 sin sesión y oculta deportistas a quien no tiene `VIEW_DIRECTORY`. El ranking/filtrado puro está en `lib/search-core.ts` (probado en `tests/search.test.ts`).
- Las ilustraciones deportivas de `components/sports/sport-scene.tsx` son SVG planos en Server Components (sin JS/hidratación). `Sport3D` es un componente cliente que carga Three.js solo cuando es visible y hay WebGL, con el SVG como respaldo.
- `project/` (prototipos de diseño) está excluido de TS/ESLint; `chats/` es la transcripción del diseño. No editar ninguno como código de la aplicación.

## Gotchas
- Admin: no puede cambiar su propio rol ni eliminarse a sí mismo; debe quedar al menos un `DOCENTE`; la cuenta invitado no se puede borrar porque sostiene el acceso público.
- Aprobar una inscripción recalcula el cupo desde las aprobadas; no guardar un número "ocupados".
- `app/forgot-password/` es solo maqueta: la página no conecta su formulario ni tiene acción de servidor, envío de correo o tokens de restablecimiento. El enlace del login existe, pero la recuperación de contraseña no está implementada.
- Las pruebas son suites Vitest puras (8 archivos, sin base de datos ni navegador): permisos, auth/contraseñas, filtros/búsqueda, validación, rate limit, semilleros y datos del seed. `tests/data.test.ts` importa `prisma/seed-data.ts`: mantén ese archivo libre de Prisma/IO y deja la escritura en `prisma/seed.ts`.
- Todo el texto de la interfaz está en español. Seguir las convenciones de comentarios/codificación existentes y evitar tocar prototipos no relacionados.
