# =============================================================================
# Softconnect Manager — Dockerfile multi-stage (Next.js standalone)
# Stage 1: deps    — instala dependências de produção
# Stage 2: builder — compila o Next.js com output standalone
# Stage 3: runner  — imagem mínima somente com o standalone output
# =============================================================================

# --- Stage 1: deps ---
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# --- Stage 2: builder ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_APP_NAME="Softconnect Manager"
ARG NEXT_PUBLIC_SOFTCOM_URL="https://softcominnovation.com.br"

ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_SOFTCOM_URL=$NEXT_PUBLIC_SOFTCOM_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build && test -d /app/.next/standalone || (echo "BUILD FAILED: standalone output not found" && exit 1)

# --- Stage 3: runner ---
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
