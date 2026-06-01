# T-Learning

Modułowa platforma PWA do zarządzania nauczaniem online.

## Spis treści

- [Wymagania](#wymagania)
- [Uruchamianie lokalnie](#uruchamianie-lokalnie)
  - [Wariant 1 — pełny stack (root)](#wariant-1--pełny-stack-root)
  - [Wariant 2 — backend i frontend osobno](#wariant-2--backend-i-frontend-osobno)
- [Struktura projektu](#struktura-projektu)

## Wymagania

- Docker Engine 20.10+ oraz Docker Compose v2 (podkomenda `docker compose`)
- Bun >= 1.0 (jeśli chcesz uruchamiać poza Dockerem)

## Uruchamianie lokalnie

1. Sklonuj repozytorium:
```bash
git clone https://github.com/turek9933/T-Learning.git
cd T-Learning
```

2. Skonfiguruj zmienne środowiskowe (DWA pliki):
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
Uzupełnij zmienne środowiskowe (Google OAuth, Resend, BetterAuth) — niektóre wartości można zostawić z `.example`.

**Spójność portów:** Zmienne frontendu: `PORT`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`,`NEXT_PUBLIC_WS_URL` oraz backendu: `PORT`,`BETTER_AUTH_URL`, `APP_URL`, `CORS_ORIGIN` muszą wskazywać na te same porty.

### Wariant 1 — całość razem

`docker-compose.yml` w katalogu głównym łączy oba człony przez `include:` i każdy z nich ładuje swój `.env`:

```bash
docker compose up -d --build
# → frontend:        http://localhost:${PORT}                (domyślnie 3000)
# → backend API:     http://localhost:${PORT}                (domyślnie 3001)
# → MinIO console:   http://localhost:${MINIO_CONSOLE_PORT}  (domyślnie 9001)
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

## Linki do zaproszeń

Po wysłaniu zaproszenia (Dashboard → Members → Invite) link pojawia się w logach backendu. Aby go wyświetlić w konsoli należy podejrzeć logi kontenera backendu po tagu [invite]:

```bash
docker compose logs -f backend | grep -F '[invite]'
```
lub
```bash
cd backend && bun invites
```
Przykładowy log to:
> [invite] email@example.com -> http://localhost:3001/invite/<id>

Szczegółowa lista komend deweloperskich i bazodanowych:
- [backend/README.md](backend/README.md) — komendy backendu, DB, Docker, invites
- [frontend/README.md](frontend/README.md) — komendy frontendu, Service Worker, Docker

## Struktura projektu

W katalogach `/backend` oraz `/frontend` znajdują się dedykowane pliki `README.md`, które traktują o bardziej szczegółowych informacjach - skupiają się też na dedukowanych komendach niezbędnych do wygodnego developmentu.

```
T-Learning/
├── backend/
│   ├── docker-compose.yml      # Postgres + migrate + MinIO + Elysia.js migrate
│   ├── Dockerfile
│   └── ...
├── frontend/
│   ├── docker-compose.yml      # Next.js (standalone)
│   ├── Dockerfile
│   └── ...
└── docker-compose.yml          # Połącznie - uruchamia frontend i backend
```