# T-Learning
*Tomasz Turek\
2025*

[Polski](#t-learning-1) | [English](#t-learning-2)

# T-Learning

# Spis treści

- [Opis](#opis)
- [Funkcjonalności](#funkcjonalności)
- [Architektura](#architektura)
- [Co zostało zrealizowane](#co-zostało-zrealizowane)
- [Wymagania](#wymagania)
- [Instalacja](#instalacja)
  - [Wariant 1 — pełny stack (root)](#wariant-1--pełny-stack-root)
  - [Wariant 2 — backend i frontend osobno](#wariant-2--backend-i-frontend-osobno)
- [Mapowanie portów i Caddy](#mapowanie-portów-i-caddy)
- [Linki do zaproszeń](#linki-do-zaproszeń)
- [Struktura projektu](#struktura-projektu)
- [Technologie](#technologie)


## Opis
**T-Learning** to modułowa platforma PWA do zarządzania nauczaniem online.<br>
Aplikacja łączy funkcjonalności Learning Management System z narzędziami komunikacyjnymi, umożliwiając elastyczne prowadzenie zajęć indywidualnych i grupowych.


## Funkcjonalności
- **Workspace (Przestrzenie robocze):** indywidualne i grupowe przestrzenie do nauki z systemem ról (właściciel, admin, uczestnik, obserwator).
- **Zarządzanie treścią:** ogłoszenia (posty), wydarzenia (kalendarz), zadania domowe, materiały dydaktyczne.
- **Czat:** WebSocket — rozmowy bezpośrednie oraz czat indywidualny w ramach workspace.
- **Przesyłanie plików:** bezpośredni upload do MinIO poprzez presigned URL-e.
- **Offline PWA:** service worker (Serwist) z cachingiem i stroną offline.
- **Autoryzacja:** email + hasło oraz Google OAuth przez Better Auth.
- **Internacjonalizacja:** język polski, angielski, włoski (next-intl).
- **Motyw:** jasny, ciemny (next-themes).


## Architektura
- **Frontend:** Next.js 16 (App Router) + React 19 + Tailwind 4 + Radix UI
- **Backend:** Bun + Elysia.js + Better Auth + Drizzle ORM
- **Baza danych:** PostgreSQL 17
- **Storage obiektów:** MinIO (S3-kompatybilny)
- **Deployment:** Docker Compose (kontenery: frontend, backend, db, minio)

Implementacja na przykładowym hostingu
```
Przeglądarka → nginx (reverse proxy) → 
    → Frontend:3001 / Backend:3002 / MinIO:3012 →
    → Docker (most network)
```


## Co zostało zrealizowane
- Workspaces: CRUD, role, członkowie, zaproszenia
- Ogłoszenia (posty) z komentarzami i załącznikami
- Wydarzenia (kalendarz, FullCalendar, eksport .ics)
- Zadania domowe z rozwiązaniami i plikami
- Czat WebSocket (DM i indywidualny w ramach workspace)
- Przesyłanie plików do MinIO (presigned URL)
- PWA: Service Worker, offline page
- Autoryzacja: email/password, Google OAuth, zmiana hasła/emaila, weryfikacja
- Walidacja pól (react-hook-form + zod)
- Internacjonalizacja (pl/en/it)
- Pełna konfiguracja Docker


## Wymagania
- Docker Engine 20.10+ oraz Docker Compose v2 (podkomenda `docker compose`)
- Bun >= 1.0 (jeśli chcesz uruchamiać poza Dockerem)


## Instalacja
1. Sklonuj repozytorium:
```bash
    git clone https://github.com/turek9933/T-Learning.git
    cd T-Learning
```

2. Skonfiguruj zmienne środowiskowe (DWA pliki):
```bash
    cp backend/.env.example backend/.env
    nano backend/.env
    cp frontend/.env.example frontend/.env
    nano backend/.env
```
Uzupełnij zmienne środowiskowe (Google OAuth, Resend, BetterAuth) — niektóre wartości można zostawić z `.example`.

**Spójność portów:**
- Zmienne frontendu: `PORT`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`,`NEXT_PUBLIC_WS_URL`
- Zmienne bbackendu: `PORT`,`BETTER_AUTH_URL`, `APP_URL`, `CORS_ORIGIN`

**Muszą wskazywać na te same porty**

### Wariant 1 — całość razem
`docker-compose.yml` w katalogu głównym łączy oba człony przez `include:` i każdy z nich ładuje swój `.env`:

```bash
docker compose up -d --build
# → frontend:        http://localhost:3001
# → backend API:     http://localhost:3002
# → MinIO API:       http://localhost:3012
# → MinIO console:   http://localhost:9001
```

Migracje DB stosują się automatycznie (`backend-migrate` job uruchamia się raz przed startem backendu).

Stop i czyszczenie:
```bash
docker compose down            # zatrzymaj
docker compose down -v         # zatrzymaj i usuń volumy (czysta DB + MinIO)
```

### Wariant 2 — backend i frontend osobno

Każdy człon ma własny `docker-compose.yml` i może działać niezależnie (np. deploy na różnych hostach):

```bash
# Backend osobno (Postgres + migrate + MinIO + Elysia.js):
cd backend && docker compose up -d --build

# Frontend osobno (Next.js)
cd frontend && docker compose up -d --build
```

Frontend nie ma żadnej zależności od backendu na poziomie sieci kontenerów — komunikacja idzie przez przeglądarkę, więc backend może być pod dowolnym osiągalnym adresem.


## Mapowanie portów i nginx

| Port | Usługa | Dostępność |
|------|--------|------------|
| 3001 | Frontend (Next.js) | Publiczny przez nginx |
| 3002 | Backend API (Elysia) | Publiczny przez nginx |
| 3012 | MinIO API (presigned URL) | Publiczny przez nginx (opcjonalnie) |
| 9001 | MinIO Console | Tylko wewnętrzny / dev |
| 5432 | PostgreSQL | Tylko wewnętrzny |

Przykładowa konfiguracja **nginx** dla domeny `twojadomena.pl`:
```nginx
server {
    server_name f.twojadomena.pl;
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    server_name b.twojadomena.pl;
    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
# Opcjonalnie, dostęp do MinIO
# server {
#     server_name m.twojadomena.pl;
#     location / {
#         proxy_pass http://localhost:3012;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#     }
# }
```

Przepływ: **nginx na hoście -> porty 3001/3002/3012 na hoście -> kontenery Docker** (most network z mapowaniem portów na hosta).


## Linki do zaproszeń
Po wysłaniu zaproszenia (Dashboard -> Members -> Invite) link pojawia się w logach backendu. Aby go wyświetlić w konsoli należy podejrzeć logi kontenera backendu po tagu [sendMail]:

```bash
docker compose logs -f backend | grep -F '[sendMail]'
```
lub
```bash
cd backend && bun mails
```
Przykładowy log to:
> [sendMail][invite] email@example.com:   http://localhost:3001/invite/<id>

Szczegółowa lista komend deweloperskich i bazodanowych:
- [backend/README.md](backend/README.md) — komendy backendu, DB, Docker, invites
- [frontend/README.md](frontend/README.md) — komendy frontendu, Service Worker, Docker


## Struktura projektu
W katalogach `/backend` oraz `/frontend` znajdują się dedykowane pliki `README.md`, które traktują o bardziej szczegółowych informacjach - skupiają się też na dedukowanych komendach niezbędnych do wygodnego developmentu.

```
T-Learning/
├── backend/
│   ├── docker-compose.yml      # Postgres + migrate + MinIO + Elysia.js
│   ├── Dockerfile
│   └── ...
├── frontend/
│   ├── docker-compose.yml      # Next.js (standalone)
│   ├── Dockerfile
│   └── ...
└── docker-compose.yml          # Połącznie - uruchamia frontend i backend
```


## Technologie

- **Frontend:**
    - Next.js 16
    - React 19
    - TypeScript
    - Tailwind CSS 4
    - Radix UI
    - TanStack Query
    - Serwist
    - next-intl
    - FullCalendar
    - react-hook-form
- **Backend:**
    - Bun
    - Elysia.js
    - Better Auth
    - Drizzle ORM
    - PostgreSQL 17
    - MinIO
    - Resend
- **Infrastruktura:** Docker, Docker Compose
- **Języki:** Polski, English, Italiano


# T-Learning


# Table of Contents

- [Description](#description-1)
- [Features](#features)
- [Architecture](#architecture-1)
- [What has been implemented](#what-has-been-implemented)
- [Requirements](#requirements)
- [Installation](#installation)
  - [Option 1 — full stack (root)](#option-1--full-stack-root)
  - [Option 2 — backend and frontend separately](#option-2--backend-and-frontend-separately)
- [Port mapping and nginx](#port-mapping-and-nginx)
- [Invitation links](#invitation-links)
- [Project structure](#project-structure)
- [Technologies](#technologies-1)


## Description
**T-Learning** is a modular PWA platform for managing online education.<br>
The application combines Learning Management System functionality with communication tools, enabling flexible individual and group teaching.


## Features
- **Workspaces:** individual and group learning spaces with role system (owner, admin, member, viewer).
- **Content management:** posts (announcements), calendar events, homeworks, learning materials.
- **Chat:** WebSocket — direct messages and workspace group chat.
- **File upload:** direct upload to MinIO via presigned URLs.
- **Offline PWA:** service worker (Serwist) with caching and offline page.
- **Authentication:** email + password and Google OAuth via Better Auth.
- **Internationalization:** Polish, English, Italian (next-intl).
- **Theme:** light, dark (next-themes).


## Architecture
- **Frontend:** Next.js 16 (App Router) + React 19 + Tailwind 4 + Radix UI
- **Backend:** Bun + Elysia.js + Better Auth + Drizzle ORM
- **Database:** PostgreSQL 17
- **Object storage:** MinIO (S3-compatible)
- **Deployment:** Docker Compose (containers: frontend, backend, db, minio)

Implementation on example hosting:
```
Browser → nginx (reverse proxy) → 
    → Frontend:3001 / Backend:3002 / MinIO:3012 →
    → Docker (bridge network)
```


## What has been implemented
- Workspaces: CRUD, roles, members, invitations
- Posts with comments and attachments
- Events (calendar, FullCalendar, .ics export)
- Homeworks with submissions and files
- WebSocket chat (DM and individual in workspaces)
- File upload to MinIO (presigned URLs)
- PWA: Service Worker, offline page
- Authentication: email/password, Google OAuth, change password/email, verification
- Form validation (react-hook-form + zod)
- Internationalization (pl/en/it)
- Full Docker setup


## Requirements
- Docker Engine 20.10+ and Docker Compose v2 (`docker compose` subcommand)
- Bun >= 1.0 (if running outside Docker)


## Installation
1. Clone the repository:
```bash
    git clone https://github.com/turek9933/T-Learning.git
    cd T-Learning
```

2. Configure environment variables (TWO files):
```bash
    cp backend/.env.example backend/.env
    nano backend/.env
    cp frontend/.env.example frontend/.env
    nano frontend/.env
```
Fill in the required variables (Google OAuth, Resend, BetterAuth) — some values can be left as defaults from `.example`.

**Port consistency:**
- Frontend vars: `PORT`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`,`NEXT_PUBLIC_WS_URL`
- Backend vars: `PORT`,`BETTER_AUTH_URL`, `APP_URL`, `CORS_ORIGIN`

**Must point to the same ports**

### Option 1 — full stack (root)

The root `docker-compose.yml` combines both parts via `include:`, each loading its own `.env`:

```bash
docker compose up -d --build
# → frontend:        http://localhost:3001
# → backend API:     http://localhost:3002
# → MinIO API:       http://localhost:3012
# → MinIO console:   http://localhost:9001
```

DB migrations run automatically (`backend-migrate` job runs once before the backend starts).

Stop and clean up:
```bash
docker compose down            # stop
docker compose down -v         # stop and remove volumes (clean DB + MinIO)
```

### Option 2 — backend and frontend separately

Each part has its own `docker-compose.yml` and can operate independently:

```bash
# Backend separately (Postgres + migrate + MinIO + Elysia.js):
cd backend && docker compose up -d --build

# Frontend separately (Next.js)
cd frontend && docker compose up -d --build
```

The frontend has no Docker network dependency on the backend — communication goes through the browser, so the backend can be at any reachable address.


## Port mapping and nginx

| Port | Service | Access |
|------|---------|--------|
| 3001 | Frontend (Next.js) | Public via nginx |
| 3002 | Backend API (Elysia) | Public via nginx |
| 3012 | MinIO API (presigned URL) | Public via nginx (optional) |
| 9001 | MinIO Console | Internal only / dev |
| 5432 | PostgreSQL | Internal only |

Example **nginx** configuration for `yourdomain.com`:

```nginx
server {
    server_name f.yourdomain.com;
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    server_name b.yourdomain.com;
    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Optional, MinIO access
# server {
#     server_name b.twojadomena.pl;
#     location / {
#         proxy_pass http://localhost:3012;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#     }
# }
```

Flow: **nginx on host → ports 3001/3002/3012 on host → Docker containers** (bridge network with host port mapping).


## Invitation links
After sending an invitation (Dashboard → Members → Invite), the link appears in the backend logs. To view it in the console, filter backend container logs by the [sendMail] tag:

```bash
docker compose logs -f backend | grep -F '[sendMail]'
```
or
```bash
cd backend && bun mails
```
Example log:
> [sendMail][invite] email@example.com:   http://localhost:3001/invite/<id>

Detailed developer and database commands:
- [backend/README.md](backend/README.md) — backend, DB, Docker, invites
- [frontend/README.md](frontend/README.md) — frontend, Service Worker, Docker


## Project structure
The `/backend` and `/frontend` directories contain dedicated `README.md` files with more detailed information, focusing on their respective commands.

```
T-Learning/
├── backend/
│   ├── docker-compose.yml      # Postgres + migrate + MinIO + Elysia.js
│   ├── Dockerfile
│   └── ...
├── frontend/
│   ├── docker-compose.yml      # Next.js (standalone)
│   ├── Dockerfile
│   └── ...
└── docker-compose.yml          # Combined - runs frontend and backend
```


## Technologies

- **Frontend:**
    - Next.js 16
    - React 19
    - TypeScript
    - Tailwind CSS 4
    - Radix UI
    - TanStack Query
    - Serwist
    - next-intl
    - FullCalendar
    - react-hook-form
- **Backend:**
    - Bun
    - Elysia.js
    - Better Auth
    - Drizzle ORM
    - PostgreSQL 17
    - MinIO
    - Resend
- **Infrastructure:** Docker, Docker Compose
- **Languages:** Polish, English, Italian

---