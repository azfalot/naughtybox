# Naughtybox

Realtime streaming platform MVP (monorepo).

## Structure

```
apps/
  backend/     # NestJS API (auth, users, stream metadata)
  streaming/   # Mediasoup WebRTC server
  frontend/    # Angular + PrimeNG + Tailwind
packages/
  shared-types/   # Types shared across apps
  shared-configs/ # ESLint, TSConfig bases
infra/
  docker/      # Dockerfiles, docker-compose (PostgreSQL, Redis, Coturn)
  nginx/       # Nginx config (reverse proxy, static frontend)
```

## Setup

1. Install dependencies (from repo root):

   ```bash
   npm install
   ```

2. Run infrastructure:

   ```bash
   docker compose -f infra/docker/docker-compose.yml up -d
   ```

3. Run apps (dev):

   ```bash
   npm run backend:dev
   npm run streaming:dev
   npm run frontend:dev
   ```

## Tech stack

- **Backend:** NestJS, PostgreSQL, Redis
- **Streaming:** Mediasoup, Coturn (TURN/STUN)
- **Frontend:** Angular 17, PrimeNG, Tailwind
- **Infra:** Docker, Nginx

See `PROJECT_CONTEXT.md` and `CURSOR_RULES.md` for architecture and conventions.
