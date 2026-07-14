# T-Learning (Backend)
*Tomasz Turek\
2025*

[Polski](#t-learning-backend-1) | [English](#t-learning-backend-2)


# T-Learning (Backend)

# Spis treści
- [Opis](#opis)
- [Wymagania](#wymagania)
- [Instalacja](#instalacja)
- [Zmienne środowiskowe](#zmienne-środowiskowe)
- [Komendy](#komendy)


## Opis
Backend platformy edukacyjnej T-Learning. Zbudowany z:
- Bun;
- Elysia;
- Better Auth;
- PostgresSQL;
- MinIO;
- Drizzle ORM.


## Wymagania
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS) lub [Docker Engine](https://docs.docker.com/engine/) (Linux)
- **Docker Compose v2** (podkomenda `docker compose` ze spacją)
- [Bun](https://bun.sh/) ≥ 1.0 (jeśli chcesz uruchamiać poza Dockerem)


## Instalacja

1. Sklonuj repozytorium do wybranego folderu (lub pobierz i wypakuj w wybranym folderze)
```bash
   git clone https://github.com/turek9933/T-Learning
```

2. Edytuj plik zmiennych środowiskowych `.env.example` i zapisz jako `.env`:
```bash
   cp T-Learning/backend/.env.example T-Learning/backend/.env
   nano T-Learning/backend/.env
```
**Mininalne zmiany to zmienne:** `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`.

Spójne muszą być:
- front: `PORT`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`
- back: `PORT`,`BETTER_AUTH_URL`, `APP_URL`, `CORS_ORIGIN`

3. Google OAuth — do pełnej funkcjonalności autoryzacji niezbędne jest skonfigurowanie [Google Cloud Console](https://console.cloud.google.com)
   1) Zaloguj się do usługi
   2) Stwórz nowy projekt lub wybierz istniejący
   3) Szukaj "OAuth client ID". W wersji, na moment publikacji tej instrukcji, jest to: `Interfejsy API i usługi -> Dane logowania -> Utwórz dane logowania -> Identyfikator klienta OAuth`. (Dla nowego projektu pojawi się informacja, aby najpierw skonfigurować dane projektu. Skonfiguruj, po czym wróć na ten ekran.)
   4) Utwórz identyfikator klienta:
      Typ aplikacji: `Aplikacja internetowa`
      Identyfikator URI — adres developerski oraz produkcyjny, np.: `http://localhost:3002/api/auth/callback/google` oraz `https://twojadomena.pl/api/auth/callback/google`
   5) Skopiuj dane do pliku .env: `Identyfikator klienta -> GOOGLE_CLIENT_ID`, `Tajny klucz klienta -> GOOGLE_CLIENT_SECRET`

4. Uruchom backend i powiązane elementy:
```bash
docker compose up -d --build
```
   Komenda startuje **pięć kontenerów** (w tej kolejności, dzięki healthcheckom i `depends_on`):
   - `db` — PostgreSQL 17
   - `minio` — object storage (port `${MINIO_PORT}` API / `${MINIO_CONSOLE_PORT}` console)
   - `minio-init` — job, jednorazowo tworzy bucket `${MINIO_BUCKET}` i `avatars`
   - `backend-migrate` — job, uruchamia `bun drizzle-kit migrate` na świeżej DB (kończy exit 0)
   - `backend` — Elysia, startuje dopiero, kiedy `backend-migrate` zakończy się sukcesem

5. Backend działa pod adresem z `backend/.env` (podane są domyślne wartości):
   - Elysia API: `http://localhost:3002`
   - MinIO API: `http://localhost:3012`
   - MinIO console: `http://localhost:9001` (login z `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD`)


## Zmienne środowiskowe
| Zmienna | Opis | Domyślnie |
|---------|------|-----------|
| `HOST` | Adres nasłuchiwania | `localhost` (w Dockerze: `0.0.0.0`) |
| `PORT` | Port API | `3002` |
| `APP_URL` | Adres frontendu (dla CORS, emaili) | `http://localhost:3001` |
| `CORS_ORIGIN` | Dozwolone originy CORS | `http://localhost:3001` |
| `DB_URL` | Connection string PostgreSQL | `postgresql://user:password@localhost:5432/t-learning` |
| `BETTER_AUTH_URL` | URL backendu dla Better Auth | `http://localhost:3002` |
| `RESEND_API_KEY` | Klucz API Resend (maile) | — |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | — |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | — |
| `MINIO_ENDPOINT` | Wewnętrzny URL MinIO | `http://localhost:3012` |
| `MINIO_PUBLIC_URL` | Zewnętrzny URL MinIO | `http://localhost:3012` |
| `MINIO_PORT` | Port MinIO API | `3012` |
| `MINIO_CONSOLE_PORT` | Port konsoli MinIO | `9001` |


## Komendy
Poniżej znajduje się lista przydatnych komend z podziałem na elementy aplikacji, których dane komendy dotyczą.

### Backend
Development

```bash
# Uruchomienie serwera deweloperskiego z hot reload'em
bun dev

# Uruchomienie serwera deweloperskiego z restartem po zmianach
bun dev:watch

# Sprawdzenie typów TypeScript
bun typecheck
```

Database

```bash
# Otwarcie Drizzle Studio (GUI do przeglądania DB)
bun db:studio

# Generowanie migracji - do użycia po zmianach w schema.ts
# Porównuje `schema.ts` ze snapshotami.
bun db:generate

# Aplikacja wygenerowanych migracji do DB.
# W Dockerze robi to automatycznie `backend-migrate`
bun db:migrate

# Bezpośrednia synchronizacja (Szybkie do iteracji w dev, omija historię migracji)
# NIE używać na produkcji
bun db:push

# Pobranie schematu z aktualnej bazy
bun db:pull

# Wypełnienie bazy przykładowymi danymi (TODO - jeszcze nie zaimplementowane)
bun db:seed
```

Docker

Skróty wokół `docker compose` (v2). Wszystkie operują na `backend/docker-compose.yml`.

```bash
# Uruchomienie wszystkich kontenerów (db, minio, minio-init, backend-migrate, backend)
bun docker:up

# Zatrzymanie wszystkiego (volumy zostają — DB i MinIO bezpieczne)
bun docker:down

# Podgląd logów ze wszystkich kontenerów
bun docker:logs

# Restart bez przebudowy
bun docker:restart

# Pełen rebuild image'a (po zmianach w Dockerfile lub kodzie)
bun docker:rebuild

# Zatrzymanie i usunięcie volumów (wyczyszczenie DB i MinIO)
bun docker:clean

# Filtruje logi backendu po tagu [sendMail].
# Przydatne do testów lokalnych.
bun mails
```
> **Zaproszenia:** Po wysłaniu zaproszenia (Dashboard -> Members -> Invite) link pojawi się w terminalu z `bun mails` w formacie `[sendMail][invite] email@example.com:     http://localhost:3001/invite/<id>`.

Produkcja (poza Dockerem)

Docker uruchamia backend przez `bun src/index.ts`. Poniższe komendy są dla scenariusza "uruchamiam backend **nie** w kontenerze".

```bash
# Zbudowanie aplikacji do dist/ 
bun build

# Uruchomienie ZBUDOWANEJ aplikacji (czyta dist/index.js)
bun start
```


# T-Learning (Backend)

# Table of Contents

- [Description](#description)
- [Requirements](#requirements)
- [Installation](#installation)
- [Environment variables](#environment-variables)
- [Commands](#commands)


## Description
Backend of the T-Learning educational platform. Built with:
- Bun;
- Elysia;
- Better Auth;
- PostgreSQL;
- MinIO;
- Drizzle ORM.


## Requirements
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS) or [Docker Engine](https://docs.docker.com/engine/) (Linux)
- **Docker Compose v2** (`docker compose` subcommand)
- [Bun](https://bun.sh/) ≥ 1.0 (if running outside Docker)


## Installation

1. Clone the repository:
```bash
    git clone https://github.com/turek9933/T-Learning
```

2. Edit the `.env.example` file and save as `.env`:
```bash
    cp T-Learning/backend/.env.example T-Learning/backend/.env
    nano T-Learning/backend/.env
```
**Required changes:** `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`.

Consistency required:
front: `PORT`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`
back: `PORT`, `BETTER_AUTH_URL`, `APP_URL`, `CORS_ORIGIN`

3. Google OAuth — configure [Google Cloud Console](https://console.cloud.google.com) for full authentication:
   1) Log in to the service
   2) Create a new project or select existing
   3) Search for "OAuth client ID": `APIs & Services -> Credentials -> Create Credentials -> OAuth client ID`
   4) Create a client ID:
      Application type: `Web application`
      Authorized redirect URIs: `http://localhost:3002/api/auth/callback/google` and `https://yourdomain.com/api/auth/callback/google`
   5) Copy values to `.env`: `Client ID → GOOGLE_CLIENT_ID`, `Client Secret → GOOGLE_CLIENT_SECRET`

4. Start the backend:
```bash
    docker compose up -d --build
```

   This starts **five containers**:
   - `db` — PostgreSQL 17
   - `minio` — object storage (port `${MINIO_PORT}` API / `${MINIO_CONSOLE_PORT}` console)
   - `minio-init` — one-shot job, creates `${MINIO_BUCKET}` and `avatars` buckets
   - `backend-migrate` — one-shot job, runs `bun drizzle-kit migrate`
   - `backend` — Elysia, starts after successful migration

5. Backend is available at:
   - Elysia API: `http://localhost:3002`
   - MinIO API: `http://localhost:3012`
   - MinIO console: `http://localhost:9001` (login: `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD`)


## Environment variables
| Variable | Description | Default |
|----------|-------------|---------|
| `HOST` | Listen address | `localhost` (in Docker: `0.0.0.0`) |
| `PORT` | API port | `3002` |
| `APP_URL` | Frontend URL (CORS, emails) | `http://localhost:3001` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3001` |
| `DB_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/t-learning` |
| `BETTER_AUTH_URL` | Backend URL for Better Auth | `http://localhost:3002` |
| `RESEND_API_KEY` | Resend API key (emails) | — |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | — |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | — |
| `MINIO_ENDPOINT` | Internal MinIO URL | `http://localhost:3012` |
| `MINIO_PUBLIC_URL` | External MinIO URL | `http://localhost:3012` |
| `MINIO_PORT` | MinIO API port | `3012` |
| `MINIO_CONSOLE_PORT` | MinIO console port | `9001` |


## Commands
Below is a list of useful commands organized by application area.

### Backend

#### Development

```bash
# Dev server with hot reload
bun dev

# Dev server with file watch restart
bun dev:watch

# TypeScript type check
bun typecheck
```

#### Database

```bash
# Drizzle Studio (GUI database browser)
bun db:studio

# Generate migrations (after schema.ts changes)
bun db:generate

# Apply migrations (automatic in Docker via backend-migrate)
bun db:migrate

# Direct schema sync (dev only, skip migration history)
# DO NOT use in production
bun db:push

# Pull schema from database
bun db:pull

# Seed database with sample data (TODO - not implemented yet)
bun db:seed
```

#### Docker

Shorthand for `docker compose` (v2). All operate on `backend/docker-compose.yml`.

```bash
# Start all containers
bun docker:up

# Stop all (volumes preserved)
bun docker:down

# Live logs from all containers
bun docker:logs

# Restart without rebuild
bun docker:restart

# Full rebuild
bun docker:rebuild

# Stop and remove volumes (clean DB + MinIO)
bun docker:clean

# Filter backend logs by [sendMail] tag (useful for local testing)
bun mails
```

> **Invitations:** After sending an invitation (Dashboard -> Members -> Invite), the link appears in the terminal with `bun mails` as `[sendMail][invite] email@example.com:     http://localhost:3001/invite/<id>`.

#### Production (outside Docker)

```bash
# Build to dist/
bun build

# Run built app
bun start
```