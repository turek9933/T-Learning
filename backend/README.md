# T-Learning (Backend)
Backend platformy edukacyjnej T-Learning. Zbudowany z: Bun; Elysia; Better Auth; PostgresSQL

## Spis treści
- [Wymagania](#Wymagania)

## Wymagania
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows)
- [Docker Engine](https://docs.docker.com/engine/) + [Docker Compose](https://docs.docker.com/compose/) (Linux)

## Instalacja

1. Sklonuj repozytorium do wybranego folderu (lub pobierz i wypakuj w wybranym folderze)
```bash
git clone https://github.com/turek9933/T-Learning
```
2. Edytuj trzy pliki zmiennych środowiskowych ```.env.example``` i zapisz je jako ```.env.```. Znajdują się one w:
- T-Learning/.env.example
- T-Learning/backend/.env.example (Min. zmian: BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, )
- T-Learning/frontend/.env.example

3. 
