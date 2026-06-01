# syntax=docker/dockerfile:1.7

# Multi-stage build
# Dependencies stage only triggered on changes in package.json

# ---------- Dependencies ----------
FROM oven/bun:1.3.14-debian AS deps
WORKDIR /app
COPY package.json bun.lock ./
# --frozen-lockfile - fail if not compatible
RUN bun install --frozen-lockfile

# ---------- Runtime ----------
FROM oven/bun:1.3.14-debian AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock tsconfig.json drizzle.config.ts ./
COPY drizzle ./drizzle
COPY src ./src

EXPOSE 3001
CMD ["bun", "src/index.ts"]