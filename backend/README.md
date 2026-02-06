# T-Learning (Backend)

Backend platformy edukacyjnej T-Learning. Zbudowany z: Bun; Elysia; Better Auth; PostgresSQL


## Spis treści

- [Wymagania](#Wymagania)
- [Instalacja](#Instalacja)
- [Komendy](#Komendy)

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

3. Google OAuth - do pełnej funkcjonalności autoryzacji niezbędne jest skonfigurowanie [Google Cloud Console](https://console.cloud.google.com)
    1) Zaloguj się do usługi
    2) Stwórz nowy projekt lub wybierz istniejący
    3) Szukaj "OAuth client ID". W obecnej wersji, jest to: ```Interfejsy API i usługi -> Dane logowania -> Utwórz dane logowania -> Identyfikator klienta OAuth```. (Dla nowego projektu pojawi się informacja, aby najpierw skonfigurować dane projektu. Skonfiguruj, po czym wróć na ten ekran.)
    4) Utwórz indentyfikator klieta:
        Typ aplikacji: ```Aplikacja internetowa```
        Idetyfikator URI - adres developerski oraz produkcyjny, np.: ```http://localhost:3001/api/auth/callback/google``` oraz ```https://api.yourdomain.com/api/auth/callback/google```
    5) Skopiuj dane do pliku .env ```Identyfikator klienta -> GOOGLE_CLIENT_ID```, ```Tajny klucz klienta -> GOOGLE_CLIENT_SECRET```

4. Uruchom backend i bazę danych
```bash
docker-compose up -d --build
```

5. Backend działa pod adresem, który wpisałeś w dokumencie ```backend/.env```


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
# Generowanie migracji - do użycia po zmianach w schema.ts
bun db:generate

# Wprowadzenie aktualizacji bazy danch
bun db:push

# Pobranie schematów z aktualnej bazy
bun db:pull

# Wypełnienie bazy przykładowymi danymi
# TODO
bun db:seed
```

Docker
```bash
# Uruchomienie wszystkiego
bun docker:up

# Zatrzymanie wszystkiego
bun docker:down

# Podgląd logów
bun docker:logs

# Restart usług
bun docker:restart

# Ponowne zbudowanie wszystkiego - do użycia po zmianach w Dockerfile i w kodzie
bun docker:rebuild

# Zatrzymanie i usunięcie danych kontenera 
bun docker:clean
```

Produkcja
```bash
# Zbudowanie aplikacji
bun build

# Uruchomienie ZBUDOWANEJ aplikacji
bun start
```