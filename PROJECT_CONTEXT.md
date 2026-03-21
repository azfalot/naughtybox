We are building phase 1 of Naughtybox as a public streaming MVP.

Architecture:

Monorepo.

apps:
- backend (NestJS API for health and stream metadata)
- frontend (Angular app for discovery and playback)
- streaming (reserved for future real-time/private features)

Infrastructure:
- Docker Compose
- MediaMTX
- PostgreSQL
- Redis
- Nginx

Phase 1 features:

- Public stream rooms
- OBS publishing through RTMP
- Browser playback through HLS
- Simple room catalog
- Dockerized local environment

Current phase 1 goal:

Validate the full streaming loop:

1. create or use a room
2. publish with OBS
3. watch from the browser

Do not over-engineer:

- no payments yet
- no private shows yet
- no subscriptions yet
- no persistence yet for stream metadata
