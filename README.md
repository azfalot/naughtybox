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
- `apps/frontend`: Angular 17 + Tailwind — see [`apps/frontend/ARCHITECTURE.md`](apps/frontend/ARCHITECTURE.md) for folder conventions
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

## Notes

- PostgreSQL and Redis are already in the stack for upcoming phases, but phase 1 still uses in-memory room metadata.
- MediaMTX replaces mediasoup for public broadcast in this MVP track.
