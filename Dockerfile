# Multi-stage build para Next.js standalone — pensado para AWS App Runner
# (mismo patrón que backend/Dockerfile). NEXT_PUBLIC_* se inlinean en el
# bundle del navegador durante `next build`, por eso van como build ARGs acá
# y no como env vars de runtime — a diferencia de BACKEND_URL, que el server
# component/route handler lee recién en tiempo de ejecución.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
# Botón "Continuar com Google" (ver src/app/login/login-form.tsx). Visible
# por defecto para pruebas; para ocultarlo, definir la variable en "false"
# (Railway la pasa como build arg; en AWS, la variable de GitHub Actions).
ARG NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN=true
ENV NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN=$NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN

RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
