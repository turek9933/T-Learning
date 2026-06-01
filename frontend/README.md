# T-Learning (Frontend)

Frontend platformy edukacyjnej T-Learning. Aplikacja **PWA** zbudowana z: Next.js 16 (App Router); React 19 (react-compiler); TanStack Query (persistent cache w IndexedDB); Serwist (Service Worker); next-intl (lokalizacja pl/en/it); Better Auth (klient); Tailwind 4 + Radix UI; FullCalendar.


## Spis treści

- [Wymagania](#wymagania)
- [Instalacja](#instalacja)
- [Komendy](#komendy)


## Wymagania
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS) lub [Docker Engine](https://docs.docker.com/engine/) (Linux)
- **Docker Compose v2** (podkomenda `docker compose` ze spacją)
- [Bun](https://bun.sh/) ≥ 1.0 (jeśli chcesz uruchamiać poza Dockerem)
- Działający backend (lokalnie pod `${NEXT_PUBLIC_API_URL}` z `frontend/.env`, domyślnie `http://localhost:3001`)


## Instalacja

1. Sklonuj repozytorium do wybranego folderu (lub pobierz i wypakuj w wybranym folderze)
```bash
git clone https://github.com/turek9933/T-Learning
```

2. Edytuj plik zmiennych środowiskowych `.env.example` i zapisz jako `.env`:

`T-Learning/frontend/.env.example`

Min. zmian: zazwyczaj **żadnych ** — domyślne wartości działają jeśli backend jest na `localhost:3001`. Koniecznie zmień wartości jeśli, backend działa pod innym adresem.

**Spójne muszą być**:\
front: `PORT`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`\
back: `PORT`, `APP_URL`, `BETTER_AUTH_URL`, `CORS_ORIGIN`

3. Uruchom frontend:
```bash
docker compose up -d --build
```
Komenda startuje **jeden kontener** `frontend` (Next.js w trybie standalone na Node 20).

Build używa secret mountu: `frontend/.env` jest mountowane jako `.env.production` tylko na czas `next build`.

4. Frontend działa pod adresem z `frontend/.env`: `http://localhost:${PORT}` (domyślnie 3000)


## Komendy

Poniżej znajduje się lista przydatnych komend z podziałem na elementy aplikacji, których dane komendy dotyczą.

### Frontend

Development
```bash
# Uruchomienie dev servera z hot reloadem (Service Worker wyłączony w trybie dev)
bun dev

# Zbudowanie aplikacji (Next.js + Serwist sw.js do public/)
bun build

# Uruchomienie ZBUDOWANEJ aplikacji, ale nie jako standalone server
bun start:dev

# Sprawdzenie typów TypeScript
bun typecheck

# Lint (ESLint + next/core-web-vitals)
bun lint
```

**Service Worker w dev:** Serwist jest świadomie wyłączony (`disable: NODE_ENV === "development"` w `next.config.ts`). Aby testować PWA — uruchom  build (`bun build` + `bun start:dev` lub `bun start`) albo przez Docker.

Docker

Skróty wokół `docker compose` (v2). Wszystkie operują na `frontend/docker-compose.yml`.

```bash
# Uruchomienie kontenera frontendu
bun docker:up

# Zatrzymanie kontenera
bun docker:down

# Podgląd logów (live)
bun docker:logs

# Restart bez przebudowy
bun docker:restart

# Pełen rebuild image'a (po zmianach w Dockerfile, kodzie lub .env)
bun docker:rebuild

# Zatrzymanie i sprzątanie
bun docker:clean
```

Produkcja (poza Dockerem)

Docker uruchamia frontend w trybie Next.js **standalone** (server.js z minimalnym node_modules). Poniższe komendy odtwarzają to lokalnie.

```bash
# Zbudowanie aplikacji (Next.js + Serwist sw.js do public/)
bun build

# Skopiowanie niezbędnych plików do odpowiedniego folderu i uruchomienie ZBUDOWANEJ aplikacji (Next.js standalone server)
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next
bun start
```

**Uwaga o standalone:** `bun start` uruchamia `node .next/standalone/server.js`. Server szuka assetów (`.next/static/`, `public/`) **obok siebie** — czyli wymaga skopiowania ich do `.next/standalone/` przed startem. Dockerfile robi to automatycznie podczas budowy image'a; lokalnie po `bun build` musisz wykonać `cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/` (lub użyć `next start` zamiast trybu standalone do szybkiego sanity check'u).
