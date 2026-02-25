# Mini Game Fullstack (Docker-Only Local Run)

This workspace runs fully through Docker Compose:

- `postgres`: PostgreSQL database
- `api`: Node.js + oRPC + Prisma backend
- `web`: Next.js frontend

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- Google OAuth credentials (Web application)

## 1) Configure environment

Copy `.env.example` to `.env` and set:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SESSION_SECRET`

Keep these for local OAuth:

- Authorized redirect URI: `http://localhost:4000/auth/google/callback`
- Authorized JavaScript origin: `http://localhost:3000`

## 2) Build and start everything

From repo root:

```powershell
docker compose up --build
```

This starts all 3 services:

- `postgres` on `localhost:5432`
- `api` on `localhost:4000`
- `web` on `localhost:3000`

The API container runs Prisma migration + Prisma client generation automatically before starting.

## 3) Open the app

- Frontend: `http://localhost:3000`
- API health check: `http://localhost:4000/health`

## Useful Docker commands

- Start in background:

```powershell
docker compose up -d --build
```

- View logs:

```powershell
docker compose logs -f
docker compose logs -f api
docker compose logs -f web
docker compose logs -f postgres
```

- Stop:

```powershell
docker compose down
```

- Stop + reset database volume:

```powershell
docker compose down -v
```

## Service details

- Prisma config: `apps/api/prisma.config.ts`
- Prisma schema/migrations: `apps/api/prisma/`
- Prisma generated client output: `apps/api/src/generated/prisma`
- API Nx Prisma targets:
  - `api:prisma-validate`
  - `api:prisma-format`
  - `api:prisma-generate`
  - `api:prisma-migrate-deploy`
