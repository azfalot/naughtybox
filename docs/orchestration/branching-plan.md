# Mixed Worktree Branching Plan

## Objetivo

Separar el arbol de trabajo mezclado en entregas pequenas por dominio para volver a PRs estrechas, revisables y con validacion local clara.

## Reglas de segmentacion

- No mezclar backend, frontend, docs y scripts de dominios distintos en la misma PR.
- Mantener una sola motivacion de producto o tecnica por rama.
- Tratar artefactos locales como ruido operativo: no deben entrar en ninguna PR.
- Si un archivo compartido toca mas de un dominio, dividir primero por contrato minimo o dejarlo para la rama del dominio que sea source of truth.

## Artefactos que no deben PRarse

| Tipo | Archivos | Accion |
| --- | --- | --- |
| Local backup | `.codex-backup/` | excluir |
| Resultados temporales | `test-results/` | excluir |
| Infra local ad hoc | `.vercel/` | excluir salvo PR de deploy |

## Inventario por dominio

| Dominio | Archivos detectados | Branch sugerida | Riesgo | Notas |
| --- | --- | --- | --- | --- |
| Admin surface | `apps/backend/src/admin/*`, `apps/frontend/src/app/features/admin/**` | `copilot/feature-admin-surface` | Medio | Aislar modulos admin y su pagina frontend sin tocar auth global. |
| Verification + auth | `apps/backend/src/verification/*`, `apps/frontend/src/app/features/auth/**`, `scripts/smoke-creator-verification.ps1` | `copilot/feature-verification-auth-flow` | Alto | Puede rozar registro, login y webhooks; validar contrato antes de abrir PR. |
| Payments + payout rail | `apps/backend/src/payments/*`, `apps/backend/src/wallet/revenue-split.ts`, `apps/frontend/src/app/features/billing/**`, `scripts/unit-revenue-split.mjs`, `scripts/smoke-payout-rail.ps1`, `scripts/smoke-provider-webhooks.ps1` | `copilot/feature-payments-payout-rail` | Alto | Mantener sandbox/live explicito y no mezclar con shows. |
| Shows + events + goals | `apps/backend/src/shows/*`, `scripts/smoke-broadcast-session.ps1` | `copilot/feature-shows-events-goals` | Alto | Toca sesiones, eventos y monetizacion contextual de room/studio. |
| Security + room policy | `apps/backend/src/security/*`, `apps/backend/src/room-access/room-access-policy.ts`, `scripts/unit-rate-limit.mjs`, `scripts/unit-room-access-policy.mjs`, `scripts/smoke-security.ps1` | `copilot/feature-security-room-policy` | Alto | Riesgo transversal sobre acceso y rate limiting; evitar mezclar con trust-safety. |
| Trust & Safety | `apps/backend/src/trust-safety/*`, `apps/frontend/src/app/features/support/**` | `copilot/feature-trust-safety-ops` | Medio | Limitar a reporting/moderation workflows y help center asociado. |
| Creator Studio split | `apps/frontend/src/app/features/creator-studio/components/creator-studio-header.component.ts`, `creator-studio-sidebar.component.ts`, `creator-profile-tab.component.ts`, `creator-monetization-tab.component.ts`, `creator-safety-tab.component.ts`, `apps/frontend/src/app/features/creator-studio/models/**`, `apps/frontend/src/app/features/creator-studio/pages/**` | `copilot/refactor-creator-studio-sections` | Medio | Refactor de superficie frontend; sin cambios de negocio si se hace bien. |
| Home + support surface | `apps/frontend/src/app/features/home/pages/home-page.component.ts`, `apps/frontend/src/assets/logo-mark.svg` | `copilot/refactor-home-support-surface` | Bajo | Mantenerlo visual y separado de stream room para evitar ruido. |
| Deploy / CI / docs | `.github/`, `vercel.json`, `scripts/deploy-frontend-vercel.ps1`, `scripts/refresh-runtime.ps1`, `docs/deploy/**`, `docs/devops/**`, `docs/guides/**`, `docs/orchestration/**` | `copilot/docs-deploy-devops-alignment` | Bajo | PR documental/infra ligera, sin logica de producto. |

## Secuencia recomendada de PRs

1. `copilot/docs-deploy-devops-alignment`
2. `copilot/refactor-creator-studio-sections`
3. `copilot/feature-security-room-policy`
4. `copilot/feature-verification-auth-flow`
5. `copilot/feature-admin-surface`
6. `copilot/feature-payments-payout-rail`
7. `copilot/feature-shows-events-goals`
8. `copilot/feature-trust-safety-ops`

## Criterio de corte por commit

Cada rama deberia arrancar con este patron minimo:

1. commit 1: mover o introducir contratos/tipos minimos del dominio
2. commit 2: implementar backend o frontend del dominio, pero no ambos si no hace falta
3. commit 3: validacion y docs del dominio

## Riesgos residuales

- Verification, payments, shows y security probablemente comparten tipos hoy no segmentados; si aparece un archivo comun, dividir primero por contrato minimo y no arrastrar toda la feature.
- Creator Studio y Home pueden compartir componentes de presentacion; si eso ocurre, extraerlos en una rama refactor previa solo si el cambio es mecanico.
- Los scripts smoke y unit deben entrar solo en la rama del dominio que validan; no usarlos como cajon de sastre.

## Resultado esperado

Tras esta segmentacion, cada dominio deberia poder entregarse en una PR pequena con:

- alcance unico
- evidencia local explicita
- cero archivos accidentales de otros dominios
- menor riesgo de conflictos y reviews mezcladas