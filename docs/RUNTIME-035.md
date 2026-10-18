# RUNTIME-035: local browser media and shared PostgreSQL

Issue35 corrects the local runtime inherited from PR34. It is a development increment, not a public release or a security certification.

## Reproduced defects

The booth iframe requests port8889, but the committed Compose file did not expose it or the WebRTC UDP media port8189. The same file declared another PostgreSQL service and volume. `evidence/runtime035-contract-red.txt` records both failing deployment-contract tests before the fix.

Once WebRTC was reachable, a synthetic H264/Opus publisher connected successfully but HLS failed: the MPEG-TS variant accepted MPEG-4 audio rather than Opus. The real server error and failed playback assertion are retained in `runtime035-codec-error.txt`, `runtime035-media-red.json` and `runtime035-media-initial.txt`.

## Correction

Compose now joins the existing external `dev-network` and addresses `shared-postgres:5432`, with a product database and credentials supplied by environment. It contains no PostgreSQL service, data volume or dependency. The backend expects `naughtybox`; destructive tests must use `naughtybox_test`. No PostgreSQL server/container was created for this change.

WebRTC HTTP8889 and UDP8189 are published on loopback. MediaMTX advertises127.0.0.1 for this local-only scenario. HLS uses fragmented MP4 so the tested browser H264/Opus stream can be played by the application's Hls.js dependency. All published local application/media endpoints bind127.0.0.1. Frontend/backend public ports are configurable; defaults in `.env.example` use4200/3180.

Primary references: [MediaMTX WebRTC connectivity](https://mediamtx.org/docs/features/webrtc-specific-features) and the [configuration shipped with MediaMTX1.17.0](https://github.com/bluenviron/mediamtx/blob/v1.17.0/mediamtx.yml). The address settings here intentionally cover localhost, not remote NAT traversal or an Internet deployment.

## Local setup

Use the already running shared PostgreSQL server. If absent, create only the product databases inside it, for example with `docker exec shared-postgres createdb -U postgres naughtybox` and the equivalent for `naughtybox_test`. Preserve existing databases and data; do not run another PostgreSQL container. The application currently bootstraps its schema on startup; a versioned migration strategy remains separate work.

Create private `.env` from `.env.example` without overwriting existing configuration; set the local shared password. Do not reuse development credentials outside local development. Then:

```sh
docker compose --env-file .env -f infra/docker/docker-compose.yml config --services
docker compose --env-file .env -f infra/docker/docker-compose.yml up --build
```

The service list must contain redis, mediamtx, backend and frontend, with no postgres entry. Check port ownership before starting. This environment's media verification uses a separate project name `naughtybox-portfolio35`; its exact container is recorded privately in the portfolio's `coordination/RUNTIME.md`. Only MediaMTX was started for the synthetic test, not the full backend/frontend stack.

## Verification and limits

The four existing application builds pass. `npm run test:units` includes all9 prior presence tests and2 new deployment contracts, all14 passing. The3 existing mocked browser workflows pass; they verify UI routing/state and do not prove real media transmission.

`NAUGHTYBOX_MEDIA_SMOKE=1 node scripts/smoke-webrtc.mjs` verifies real synthetic WebRTC→MediaMTX→HLS→Hls.js playback: H264+Opus,320×240 decoded video, currentTime advancing, audio codec in the playlist and source stopped after closing the publisher. It uses fake Chromium devices only and a unique test path. It never accesses a physical camera/microphone or a remote server. Machine evidence is in `runtime035-media.json` and synthetic screenshots. The initial workspace dependency-resolution problem in the test harness was corrected to use the frontend's installed Hls.js.

Local WebRTC traces can contain local ICE addresses, so they are ignored by Git and retained privately. CI uploads its own synthetic trace and runtime logs. The workflow builds, runs14 contracts, tests real media and runs3 mocked browser workflows; it does not certify the whole streaming product.

The dependency audit remains a separate release blocker: the inherited lockfile reports27 production dependency advisories, including2 critical. See issue36 and `runtime035-production-audit.json`. No major dependency upgrades or payment/identity changes are bundled into this runtime change. Backend broadcast concurrency, ingest authorization, stop synchronization, OBS-specific playback and deployment validation need their own verification; no public release is claimed.

The first remote CI run39125215369 correctly failed on the initial HLS request exceeding its4-second per-probe timeout. A delayed local HTTP fixture reproduced the escaped timeout before fixing the readiness helper. Only TimeoutError now means a pending probe: the25-second overall deadline, codec check and real playback assertions remain unchanged; invalid URLs still fail immediately. The3 additional readiness tests bring the registered unit total to14. CI artifacts use a separate -ci suffix and exclude archived local reports.
