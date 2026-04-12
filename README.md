# Naughtybox

Phase 1 MVP for a modern live streaming platform.

## Scope of phase 1

- Public live rooms
- OBS publishing through RTMP
- HLS playback in the browser
- NestJS backend for room metadata and health checks
- Angular frontend for room discovery and playback
- Docker Compose stack for local validation

## Stack

- `apps/backend`: NestJS API
- `apps/frontend`: Angular 17 + Tailwind
- `apps/streaming`: reserved for future low-latency features
- `infra/docker`: Docker Compose + MediaMTX
- `infra/nginx`: reverse proxy reference
- `packages/shared-types`: contracts shared across apps

## Local phase 1 architecture

```text
OBS -> RTMP -> MediaMTX -> HLS -> Browser
              |
              +-> Backend exposes room metadata and OBS instructions
```

## Run the stack

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

Services:

- Frontend: `http://localhost:4200`
- Backend API: `http://localhost:3000`
- Media server HLS: `http://localhost:8888`
- MediaMTX metrics: `http://localhost:9998`
- RTMP ingest for OBS: `rtmp://localhost:1935/live`

## Test with OBS

Use one of the seeded stream keys exposed by the API:

- `luna-en-directo`
- `sara-night-show`

In OBS:

- Server: `rtmp://localhost:1935/live`
- Stream key: one of the slugs above

Then open the matching room in the frontend:

- `http://localhost:4200/streams/luna-en-directo`
- `http://localhost:4200/streams/sara-night-show`

## Frontend architecture

The Angular app under `apps/frontend/src/app` follows a three-layer layout:

```
app/
├── app.component.ts        # App shell (header, age gate, nav, footer)
├── app.config.ts           # Angular providers
├── app.routes.ts           # Top-level route declarations
├── features/               # One sub-folder per product feature
│   ├── auth/               # login-page, register-page
│   ├── creator-studio/     # creator-studio-page
│   ├── home/               # home-page (stream catalog)
│   ├── legal/              # legal-page
│   └── stream/             # stream-page (room view)
└── shared/
    ├── components/         # Reusable UI components (e.g. stream-player)
    └── services/           # API services shared across features
```

**Conventions:**
- Page components live under `features/<feature-name>/`.
- UI components used by more than one feature live under `shared/components/`.
- Injectable API services live under `shared/services/`.
- App-level shell code (`app.component.ts`, `app.config.ts`, `app.routes.ts`) stays at the `app/` root.

## Notes

- PostgreSQL and Redis are already in the stack for upcoming phases, but phase 1 still uses in-memory room metadata.
- MediaMTX replaces mediasoup for public broadcast in this MVP track.
