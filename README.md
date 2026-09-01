# Partner Activation Program — Frontend

Frontend Next.js (App Router) del Partner Activation Program (Kaspersky). Contexto de negocio
y decisiones de arquitectura en `../CLAUDE.md`.

## Setup

```bash
npm install
cp .env.example .env   # completar con los datos reales de Supabase/backend
npm run dev            # http://localhost:3000
```

Necesita el backend corriendo en paralelo (`../backend`, ver su README) — la mayoría de las
páginas hacen fetch server-side contra `BACKEND_URL`.

## Documentación de producto

`docs/guia-de-uso.html` — guía de uso para el equipo Kaspersky (administradores y parceiros),
no técnica. Abrir directo en el navegador.

## Variables de entorno (`.env`)

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase — misma que el backend. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key (`sb_publishable_...`) — pública a propósito, va al navegador. |
| `BACKEND_URL` | URL del backend NestJS. Local: `http://localhost:3001`. |

## Estructura

- `src/app/login/` — login passwordless (magic link) + Google OAuth.
- `src/app/auth/callback/` — intercambia el código OAuth/magic link por sesión. Usa
  `x-forwarded-host` en producción (no `request.url` directo) porque atrás del proxy de
  Railway/App Runner ese valor puede reflejar la dirección interna del contenedor en vez de la
  URL pública.
- `src/app/dashboard/` — vista del partner: mapa de progreso de milestones
  (`journey-map.tsx`, camino en zigzag con Framer Motion) + rewards elegibles/solicitados.
- `src/app/admin/dashboard/` — KPIs del admin (tarjetas + gráfico de altas semanales,
  Recharts).
- `src/app/admin/partners/` — invitación, listado y detalle (historial de evidencias) de
  partners.
- `src/app/admin/evidence/` — cola de evidencias pendientes de revisión.
- `src/app/admin/rewards/` — catálogo de rewards + cola de solicitudes de redención.
- `src/app/api/` — route handlers que reenvían al backend con el `access_token` de la sesión
  (el navegador nunca llama al backend directo, ni tiene el service role key).
- `src/lib/supabase/` — clientes Supabase (`client.ts` navegador, `server.ts` server
  components/route handlers).
- `src/lib/csv.ts` + `src/components/export-csv-button.tsx` — exportación CSV reutilizable
  (usada en las 3 listas admin: partners, evidencias, redenciones).
- `src/proxy.ts` — protege rutas autenticadas (en Next 16 `middleware.ts` se renombró a
  `proxy.ts`, mismo comportamiento).

## Diseño

Skill `minimalist-ui` (editorial, monocromático cálido, sin gradientes/sombras pesadas) +
colores extraídos de `my.kaspersky.com` (ver tokens en `src/app/globals.css`). Los colores de
estado (`pastel-*`, usados en todos los badges) están registrados en el bloque `@theme inline`
de Tailwind v4 — si se agrega un color nuevo a `:root`, hay que agregarlo también ahí o la
clase `bg-*`/`text-*` no genera CSS real (bug real que se dio en este proyecto, ver historial
de commits).

## Deploy

CI/CD vía GitHub Actions (`.github/workflows/deploy.yml`) hacia AWS App Runner —
`NEXT_PUBLIC_*` se inlinean en el bundle del navegador durante `next build` (build args del
Dockerfile), no son env vars de runtime normales: cambiarlas requiere rebuild + push de imagen
nueva. Ver `infra/terraform/README.md`.
