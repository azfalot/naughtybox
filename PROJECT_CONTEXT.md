We are building a realtime streaming platform MVP.

Architecture:

Monorepo.

apps:
- backend (NestJS)
- streaming (Mediasoup)
- frontend (Angular + PrimeNG)

Infrastructure:
Docker
Nginx
PostgreSQL
Redis
Coturn

Features:

Users can register and login.

Streamers can start a stream using OBS.

Viewers can watch the stream in browser.

Streaming is handled by mediasoup.

All services must run using docker-compose.

Code must be modular and production ready.