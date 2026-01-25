# T-Learning

Modułowa platforma PWA do zarządzania nauczaniem online.

## Spis treści

- [Wymagania](#wymagania)
- [Instalacja](#instalacja)

### Wymagania
- Bun >= 1.0
- Docker & Docker Compose

### Instalacja
1. Sklonuj repozytorium i zainstaluj zależności:
```bash
git clone https://github.com/turek9933/T-Learning.git
cd t-learning
bun install
cd frontend && bun install
cd ../backend && bun install
```

2. Uruchom bazę danych i wiadro danych:
```bash
#TODO Arcyskomplikowane komend
```

3. Dodaj pliki ze zmiennymi środowiskowymi:
```bash
# Backend
# Edytuj backend/.env

# Frontend
# Edytuj frontend/.env
```


4. Uruchom aplikacje (2 terminale):

Terminal 1 - Backend:
```bash
cd backend
bun dev
```

Terminal 2 - Frontend:
```bash
cd frontend
bun dev
```

Aplikacje dostępne domyślnie na:
- Frontend: http://localhost:19000
- Backend API: http://localhost:19001
- MinIO Console: http://localhost:19002


## Struktura projektu
```
t-learning/
├── frontend/          # Next.js PWA
├── backend/           # Elysia.js
└── docker-compose.yml
```