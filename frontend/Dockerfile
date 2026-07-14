# syntax=docker/dockerfile:1.7


# ---------- Dependencies ----------
FROM oven/bun:1.3.14-debian AS deps
WORKDIR /app
COPY package.json bun.lock ./
# --frozen-lockfile - fail if not compatible
RUN bun install --frozen-lockfile


# ---------- Build ----------
FROM oven/bun:1.3.14-debian AS build
WORKDIR /app
# Turns off telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Mount frontend_env (frontend/.env) as .env.production for the duration of this RUN only
RUN --mount=type=secret,id=frontend_env,target=/app/.env.production,required=true \
    bun run build


# ---------- Runtime ----------
FROM node:26-bookworm AS runtime
WORKDIR /app

# Turns off dev mode and disables telemetry during runtime.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3001 \
    HOSTNAME=0.0.0.0

# Create nextjs user and group - run as non-root
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs
# Set working directory with nextjs user
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to nextjs user
USER nextjs
EXPOSE 3001
CMD ["node", "server.js"]