# Frontend Architecture

Angular 17 standalone-component application.

## Folder conventions

```
src/app/
├── app.component.ts       # App shell: topbar, nav, age-gate, footer
├── app.config.ts          # Global providers (router, HTTP client)
├── app.routes.ts          # Top-level route definitions
│
├── features/              # Feature-specific code, grouped by domain
│   ├── auth/              # Login and registration pages
│   ├── catalog/           # Home/lobby – stream grid and discovery
│   ├── stream/            # Single stream room (player + chat + profile)
│   ├── studio/            # Creator Studio (profile, room config, wallet)
│   └── legal/             # Legal/policy pages
│
├── services/              # Cross-feature API clients (injected broadly)
│   ├── auth-api.service.ts
│   ├── chat-api.service.ts
│   ├── creator-api.service.ts
│   ├── streams-api.service.ts
│   └── wallet-api.service.ts
│
└── shared/                # Shared UI components reused across features
    └── stream-player.component.ts
```

## Rules of thumb

- **App shell** (`app.component.ts`, `app.config.ts`, `app.routes.ts`) stays at the `app/` root. It is the entry point for every route and owns the global layout.
- **Features** own their page components. Each subdirectory under `features/` maps to a domain area. If a component is only ever used by one feature, it lives inside that feature's folder.
- **Shared** holds components consumed by more than one feature (e.g. `StreamPlayerComponent` is used by both `catalog` and `stream`).
- **Services** under `services/` are cross-feature API clients. A service that is strictly internal to a single feature can be colocated in that feature's folder instead.
- Import paths from feature components follow the relative pattern `../../services/` and `../../shared/`.

## Adding a new feature

1. Create `src/app/features/<feature-name>/`.
2. Add page component(s) inside it.
3. Register the route in `app.routes.ts`.
4. Add any feature-only services alongside the component. Promote to `services/` only if another feature needs to inject the same service.
