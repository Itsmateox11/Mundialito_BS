# AGENTS.md

## Stack
- Next.js 14 (App Router, RSC, Server Actions), TypeScript strict, Prisma 5 + SQLite (`prisma/dev.db`, `file:./dev.db`), Tailwind + shadcn/ui (Radix Slot/cva), vitest, ESLint `next/core-web-vitals`.
- Path alias `@/*` -> repo root. Fonts unified to League Spartan via `next/font/google` (variable `--font-league-spartan`; Tailwind maps `font-display/sans/narrow` to it).
- `prisma generate` on `postinstall`. Local-only (SQLite).

## Commands
```bash
npm install          # install + prisma generate
cp .env.example .env
npm run db:migrate   # prisma migrate dev
npm run db:seed      # seed torneo + demo
npm run dev
npm run lint
npm run typecheck     # tsc --noEmit
npm test              # vitest run (node)
npm run verify        # lint && typecheck && test && build  (matches CI)
npm run db:reset      # prisma migrate reset --force
npm run db:studio
```
- CI (`.github/workflows/ci.yml`): Node 20, `npm ci`, `npx prisma migrate deploy`, lint/typecheck/test/build with `DATABASE_URL=file:./ci.db`.

## DB/schema (SQLite)
- No enums/arrays: states via `lib/domain.ts`, lists JSON (e.g. `Sport.requirements`). 
- Roles `ESTUDIANTE|DOCENTE|INVITADO`. `User.passwordHash` null for guest. `Session` with role-based expiry.
- `MatchEvent` `GOL|AMARILLA|ROJA`; only `GOL` affects stats/leaderboard. Goal-sports `microfutbol`/`balon-mano` derive from events; others use manual scores/`scoreNote`. Points 3/1/0 computed.
- Semilleros separate from Mundialito: `SemilleroEnrollment` `INSCRITO|CANCELADO`, re-enroll reactivates; capacity enforced in transaction.

## Auth/permissions (critical)
- Capabilities in `lib/permissions.ts` (pure). `INVITADO` only `VIEW_PUBLIC`. `ESTUDIANTE` has athlete+member caps. `DOCENTE` has member+all admin caps (no athlete caps). `HOME_BY_ROLE`: docente→`/admin`, estudiante→`/dashboard`, invitado→`/deportes`.
- Guards: `requireUser()`→`/login`, `requireCapability()`→`homeFor()`, `authorize()` throws `NotAuthorizedError` in server actions. Nav filtering is courtesy only.
- Sessions: role expiry (docente 1d, estudiante 7d, invitado 1d), httpOnly/sameSite=lax/secure in prod; expired swept on login. Role changes delete all user sessions.
- Passwords: Node `scrypt` `scrypt$N$r$p$salt$hash` with stored params, `normalize("NFKC")`, constant-time compare.
- Rate limit (`lib/rate-limit.ts`): in-memory `origin|email` (x-forwarded-for/x-real-ip), 5/15min→10min lock, cleared on success. Check+reserve before password verify.
- Login: window must match role (server). Public registration forces `ESTUDIANTE`, requires exact `@colsantander.edu.co`, sport choice single or `"none"`. Guest via `INVITADO` user. Demo autofill via `NEXT_PUBLIC_DEMO_AUTOFILL` (default on).

## Architecture
- `(panel)` layout calls `requireUser()`. Nav grouped/filtered by capability; admin sidebar shows admin modules. 
- `app/(panel)/deportes/[slug]/page.tsx` has `generateStaticParams()`. `/api/buscar` `force-dynamic`. 
- Server actions in route dirs use `authorize()` + `revalidatePath()`. 3D scenes dynamically imported with `ssr: false`.
- `project/` (design prototypes) excluded from TS/ESLint; `chats/` design transcript.

## Gotchas
- Admin: cannot change own role; cannot demote last teacher (>=1 `DOCENTE`). Sessions invalidated on role change.
- Enrollment approval recalculates approved counts for capacity.
- Announcements can link to `Match`/`Player` (nullable) with fallback.
- Search requires session + server permission checks.
- All UI copy Spanish. Tests 227/227 pass, typecheck/lint clean.
