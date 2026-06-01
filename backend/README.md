# T-Learning (Backend)

Backend platformy edukacyjnej T-Learning. Zbudowany z: Bun; Elysia; Better Auth; PostgresSQL


## Spis treści

- [Wymagania](#Wymagania)
- [Instalacja](#Instalacja)
- [Komendy](#Komendy)


## Wymagania
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS) lub [Docker Engine](https://docs.docker.com/engine/) (Linux)
- **Docker Compose v2** (podkomenda `docker compose` ze spacją)
- [Bun](https://bun.sh/) ≥ 1.0 (jeśli chcesz uruchamiać poza Dockerem)


## Instalacja

1. Sklonuj repozytorium do wybranego folderu (lub pobierz i wypakuj w wybranym folderze)
```bash
git clone https://github.com/turek9933/T-Learning
```

2. Edytuj dwa pliki zmiennych środowiskowych ```.env.example``` i zapisz je jako ```.env.```. Znajdują się one w:
- T-Learning/backend/.env.example
    - Min. zmian: `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`
- T-Learning/frontend/.env.example

    **Spójne muszą być**:\
    front:  `PORT`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`\
    back: `PORT`,`BETTER_AUTH_URL`, `APP_URL`, `CORS_ORIGIN`

3. Google OAuth - do pełnej funkcjonalności autoryzacji niezbędne jest skonfigurowanie [Google Cloud Console](https://console.cloud.google.com)
    1) Zaloguj się do usługi
    2) Stwórz nowy projekt lub wybierz istniejący
    3) Szukaj "OAuth client ID". W obecnej wersji, jest to: ```Interfejsy API i usługi -> Dane logowania -> Utwórz dane logowania -> Identyfikator klienta OAuth```. (Dla nowego projektu pojawi się informacja, aby najpierw skonfigurować dane projektu. Skonfiguruj, po czym wróć na ten ekran.)
    4) Utwórz indentyfikator klieta:
        Typ aplikacji: ```Aplikacja internetowa```
        Idetyfikator URI - adres developerski oraz produkcyjny, np.: ```http://localhost:${PORT}/api/auth/callback/google``` (gdzie `${PORT}` to wartość z `backend/.env`, domyślnie 3001) oraz ```https://api.yourdomain.com/api/auth/callback/google```
    5) Skopiuj dane do pliku .env ```Identyfikator klienta -> GOOGLE_CLIENT_ID```, ```Tajny klucz klienta -> GOOGLE_CLIENT_SECRET```

4. Uruchom backend i powiązane elementy:
```bash
docker compose up -d --build
```

   Komenda startuje **pięć kontenerów** (w tej kolejności, dzięki healthcheckom i `depends_on`):
   - `db` — PostgreSQL 17
   - `minio` — object storage
   - `minio-init` — job, jednorazowo tworzy bucket `${MINIO_BUCKET}`
   - `backend-migrate` — job, uruchamia `bun drizzle-kit migrate` na świeżej DB (kończy exit 0; migracje aplikują się automatycznie, nie trzeba `bun db:push` ręcznie)
   - `backend` — Elysia, startuje dopiero gdy `backend-migrate` zakończy się sukcesem

5. Backend działa pod adresem z `backend/.env`:
   - Elysia API: `http://localhost:${PORT}` (domyślnie 3001)
   - MinIO console: `http://localhost:${MINIO_CONSOLE_PORT}` (domyślnie 9001, login z `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD`)


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

# Filtruje logi backendu po tagu [invite].
# Przydatne do testów lokalnych.
bun invites
```

> **Zaproszenia:** Po wysłaniu zaproszenia (Dashboard -> Members -> Invite) link pojawi się w terminalu z `bun invites` w formacie `[invite] email@example.com -> http://localhost:${PORT}/invite/<id>`.

Produkcja (poza Dockerem)

Docker uruchamia backend przez `bun src/index.ts`. Poniższe komendy są dla scenariusza "uruchamiam backend **nie** w kontenerze".

```bash
# Zbudowanie aplikacji do dist/ 
bun build

# Uruchomienie ZBUDOWANEJ aplikacji (czyta dist/index.js)
bun start
```