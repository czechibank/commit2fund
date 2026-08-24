# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
ENV HUSKY=0
RUN npm install -g pnpm@10
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Full source with dependencies. The compose "migrate" service runs
# `pnpm run db:migrate` from this stage, so it must not depend on the
# Next.js build below.
FROM deps AS source
COPY . .

FROM source AS build
# NEXT_PUBLIC_* values are baked into the client bundle at build time.
ARG NEXT_PUBLIC_APP_URL=http://localhost:3001
# env.ts validates all variables during `next build`; everything except
# NEXT_PUBLIC_APP_URL is only read at runtime, so placeholders suffice.
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    DATABASE_URL=postgres://build:build@localhost:5432/build \
    AUTH_SECRET=build-time-placeholder-secret-32-chars-long \
    BETTER_AUTH_URL=$NEXT_PUBLIC_APP_URL \
    CZECHIBANK_API_URL=http://localhost:3000 \
    HOST=localhost:3001
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q --spider "http://127.0.0.1:${PORT}/api/health" || exit 1
CMD ["node", "server.js"]
