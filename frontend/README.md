# T-Learning (Frontend)
*Tomasz Turek\
2026*

[Polski](#t-learning-frontend-1) | [English](#t-learning-frontend-2)


# T-Learning (Frontend)


# Spis treści
- [Opis](#opis)
- [Wymagania](#wymagania)
- [Instalacja](#instalacja)
- [Architektura](#architektura)
- [Komendy](#komendy)
- [PWA i Service Worker](#pwa-i-service-worker)


## Opis
Aplikacja **PWA** zbudowana z:
- Next.js 16 (App Router);
- React 19 (react-compiler);
- TanStack Query (persistent cache w IndexedDB);
- Serwist (Service Worker);
- next-intl (lokalizacja pl/en/it);
- Better Auth (klient);
- Tailwind 4 + Radix UI;
- FullCalendar.

Frontend platformy edukacyjnej T-Learning. Aplikacja typu Progressive Web App umożliwiająca zarządzanie workspace'ami, ogłoszeniami, wydarzeniami, zadaniami domowymi, czatem oraz plikami. Działa w trybie offline z automatyczną synchronizacją po przywróceniu połączenia.


## Wymagania
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS) lub [Docker Engine](https://docs.docker.com/engine/) (Linux)
- **Docker Compose v2** (podkomenda `docker compose` ze spacją)
- [Bun](https://bun.sh/) ≥ 1.0 (jeśli chcesz uruchamiać poza Dockerem)
- Działający backend (lokalnie pod `${NEXT_PUBLIC_API_URL}` z `frontend/.env`, domyślnie `http://localhost:3002`)


## Instalacja

1. Sklonuj repozytorium do wybranego folderu (lub pobierz i wypakuj w wybranym folderze)
```bash
    git clone https://github.com/turek9933/T-Learning
```

2. Edytuj plik zmiennych środowiskowych `.env.example` i zapisz jako `.env`:
```
    cp T-Learning/frontend/.env.example T-Learning/frontend/.env
    nano T-Learning/frontend/.env
```

Minimalnie nie trzeba wykonywać **żadnych** zmian — domyślne wartości działają jeśli backend jest na `localhost:3002`.\
**Koniecznie** zmień wartości jeśli backend działa pod innym adresem.

**Spójne muszą być**:
- front: `PORT`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`
- back: `PORT`, `APP_URL`, `BETTER_AUTH_URL`, `CORS_ORIGIN`

3. Uruchom frontend:
```bash
    docker compose up -d --build
```
Komenda startuje **jeden kontener** `t-learning-frontend` (Next.js w trybie standalone na Node 26).

Build używa secret mountu: `frontend/.env` jest mountowane jako `.env.production` tylko na czas `next build`.

4. Frontend działa pod adresem z `frontend/.env`: domyślnie `http://localhost:3001`


## Architektura
- **Framework:** Next.js 16 (App Router) z output `standalone`
- **Stan aplikacji:** TanStack Query z persystencją w IndexedDB (przez `idb-keyval`)
- **Routing i auth:** next-intl (lokalizacja) + middleware (ochrona tras)
- **UI:** Tailwind CSS 4 + Radix UI + lucide-react (ikony)
- **Formularze:** react-hook-form
- **PWA:** Serwist (Service Worker)
- **WebSocket:** natywny `ws-client.ts` dla czatu

### Struktura katalogów

```
src/
├── app/          # Next.js App Router (pages, layout)
│   ├── [locale]/       # Lokalizowane strony
│   ├── (auth)/         # Login, register, reset password
│   ├── (dashboard)/    # Dashboard, workspaces, chat, settings
│   └── (public)/       # Landing page
├── components/   # Współdzielone komponenty UI
├── lib/          # hooks, queries, utils, auth-client, ws-client
├── locales/      # pl.json, en.json, it.json
├── i18n/         # next-intl routing i request
└── types/        # TypeScript typy
```


## Komendy
Poniżej znajduje się lista przydatnych komend z podziałem na elementy aplikacji, których dane komendy dotyczą.

### Development
```bash
# Uruchomienie dev servera z hot reloadem
bun dev

# Zbudowanie aplikacji (Next.js + Serwist sw.js do public/)
bun build

# Uruchomienie ZBUDOWANEJ aplikacji (nie standalone)
bun start:dev

# Sprawdzenie typów TypeScript
bun typecheck

# Lint (ESLint + next/core-web-vitals)
bun lint
```

### Docker
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

### Produkcja (poza Dockerem)

```bash
# Zbudowanie aplikacji
bun build

# Uruchomienie standalone serwera
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next
bun start
```

**Uwaga o standalone:** `bun start` uruchamia `node .next/standalone/server.js`. Server szuka assetów (`.next/static/`, `public/`) **obok siebie** — wymaga skopiowania ich do `.next/standalone/` przed startem.


## PWA i Service Worker
Service Worker (Serwist) jest świadomie wyłączony w trybie deweloperskim (`disable: NODE_ENV === "development"` w `next.config.ts`).

Aby testować PWA — uruchom build (`bun build` + `bun start:dev` lub przez Docker).

Precached offline fallback:
- `/en/offline`
- `/pl/offline`
- `/it/offline`


# T-Learning (Frontend)


# Table of Contents

- [Description](#description)
- [Requirements](#requirements)
- [Installation](#installation)
- [Architecture](#architecture)
- [Commands](#commands)
- [PWA and Service Worker](#pwa-and-service-worker)


## Description
A **PWA** application built with:
- Next.js 16 (App Router);
- React 19 (react-compiler);
- TanStack Query (persistent cache in IndexedDB);
- Serwist (Service Worker);
- next-intl (localization pl/en/it);
- Better Auth (client);
- Tailwind 4 + Radix UI;
- FullCalendar.

Frontend of the T-Learning educational platform. A Progressive Web App enabling management of workspaces, announcements, events, homeworks, chat, and files. Works offline with automatic synchronization when connection is restored.


## Requirements
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS) or [Docker Engine](https://docs.docker.com/engine/) (Linux)
- **Docker Compose v2** (`docker compose` subcommand)
- [Bun](https://bun.sh/) ≥ 1.0 (if running outside Docker)
- Running backend (at `${NEXT_PUBLIC_API_URL}` from `frontend/.env`, default `http://localhost:3002`)


## Installation

1. Clone the repository:
```bash
    git clone https://github.com/turek9933/T-Learning
```

2. Edit the `.env.example` file and save as `.env`:
```bash
    cp T-Learning/frontend/.env.example T-Learning/frontend/.env
    nano T-Learning/frontend/.env
```

Minimal changes: usually **none** — defaults work if backend is on `localhost:3002`.\
**Change values if backend runs on a different address.**

**Consistency required**:
- front: `PORT`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`
- back: `PORT`, `APP_URL`, `BETTER_AUTH_URL`, `CORS_ORIGIN`

3. Start the frontend:
```bash
    docker compose up -d --build
```
Starts **one container** `t-learning-frontend` (Next.js standalone on Node 26).

Build uses secret mount: `frontend/.env` is mounted as `.env.production` only during `next build`.

4. Frontend is available at: `http://localhost:3001`


## Architecture
- **Framework:** Next.js 16 (App Router) with `standalone` output
- **State management:** TanStack Query with IndexedDB persistence (`idb-keyval`)
- **Routing & auth:** next-intl (localization) + middleware (route protection)
- **UI:** Tailwind CSS 4 + Radix UI + lucide-react (icons)
- **Forms:** react-hook-form
- **PWA:** Serwist (Service Worker)
- **WebSocket:** native `ws-client.ts` for chat

### Directory structure

```
src/
├── app/          # Next.js App Router (pages, layout)
│   ├── [locale]/       # Localized pages
│   ├── (auth)/         # Login, register, reset password
│   ├── (dashboard)/    # Dashboard, workspaces, chat, settings
│   └── (public)/       # Landing page
├── components/   # Shared UI components
├── lib/          # hooks, queries, utils, auth-client, ws-client
├── locales/      # pl.json, en.json, it.json
├── i18n/         # next-intl routing and request
└── types/        # TypeScript types
```


## Commands
Below is a list of useful commands organized by application area.

### Development
```bash
    # Dev server with hot reload
    bun dev

    # Build application (Next.js + Serwist sw.js to public/)
    bun build

    # Run built app (not standalone)
    bun start:dev

    # TypeScript type check
    bun typecheck

    # Lint (ESLint + next/core-web-vitals)
    bun lint
```

### Docker
Shorthand for `docker compose` (v2). All operate on `frontend/docker-compose.yml`.

```bash
    # Start frontend container
    bun docker:up

    # Stop container
    bun docker:down

    # Live logs
    bun docker:logs

    # Restart without rebuild
    bun docker:restart

    # Full rebuild (Dockerfile, code, or .env changes)
    bun docker:rebuild

    # Stop and clean up
    bun docker:clean
```

### Production (outside Docker)

```bash
    # Build application
    bun build

    # Run standalone server
    cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next
    bun start
```

**Note about standalone:** `bun start` runs `node .next/standalone/server.js`. The server looks for assets (`.next/static/`, `public/`) **next to itself** — they must be copied to `.next/standalone/` before starting.


## PWA and Service Worker
Serwist is intentionally disabled in development mode (`disable: NODE_ENV === "development"` in `next.config.ts`).

To test PWA features — build the app (`bun build` + `bun start:dev` or via Docker).

Precached offline fallback pages:
- `/en/offline`
- `/pl/offline`
- `/it/offline`