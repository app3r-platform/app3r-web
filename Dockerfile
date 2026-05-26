# App3R Frontend — Docker Prototype (เฟส 3)
# Multi-stage: builder → runner
# 5 Next.js apps (pnpm turbo): admin:3000 weeer:3001 weeeu:3002 weeet:3003 app3r:3004

# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Enable corepack for pnpm version management
RUN corepack enable && corepack prepare pnpm@10.8.1 --activate

# Copy workspace config + package manifests (for layer cache)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/admin/package.json   ./apps/admin/
COPY apps/weeer/package.json   ./apps/weeer/
COPY apps/weeeu/package.json   ./apps/weeeu/
COPY apps/weeet/package.json   ./apps/weeet/
COPY apps/app3r/package.json   ./apps/app3r/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json     ./packages/ui/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps     ./apps
COPY packages ./packages

# Backend URL for Docker network (override localhost → service name)
ARG BACKEND_URL=http://app3r_backend:8000
ENV BACKEND_URL=${BACKEND_URL}

# DevNav flag — bake into Next.js bundle at build time (NEXT_PUBLIC_ must be build-time)
ARG NEXT_PUBLIC_DEV_NAV=false
ENV NEXT_PUBLIC_DEV_NAV=${NEXT_PUBLIC_DEV_NAV}

# Build 5 Next.js apps via turbo (exclude @app3r/backend — TypeScript/Node, ไม่ต้องการใน container นี้)
RUN pnpm turbo build --filter=admin --filter=weeer --filter=weeeu --filter=weeet --filter=app3r

# ─── Stage 2: Runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.8.1 --activate

ENV NODE_ENV=production

# Copy full workspace from builder (next start requires node_modules + .next)
COPY --from=builder /app .

# Copy + set entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000 3001 3002 3003 3004

ENTRYPOINT ["/docker-entrypoint.sh"]
