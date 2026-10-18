# SECURITY-036: Remediation of Critical Production Dependencies

Issue 36 addresses the critical security vulnerabilities in the production lockfile of NaughtyBox inherited from prior development increments.
This remediation represents a security hardening step within the development cycle; it does **not** constitute a security certification or a public production release.

---

## 1. Context and Problem Statement

A reproducible audit executed on the production dependencies (`npm audit --omit=dev`) against commit `b1deddc` reported **27 production advisories**:
- **2 Critical**
- **10 High**
- **14 Moderate**
- **1 Low**

The 2 critical vulnerabilities were identified in foundational transitive packages:
1. **`proxy-addr` (1.1.0 - 2.0.7):** [GHSA-jqcg-44mw-7w3h](https://github.com/advisories/GHSA-jqcg-44mw-7w3h) (CVSS 9.1). Vulnerable to IP spoofing via IPv4-mapped IPv6 trust subnet parsing.
2. **`tar` (<=7.5.20):** [GHSA-23hp-3jrh-7fpw](https://github.com/advisories/GHSA-23hp-3jrh-7fpw) (Decompression/parse DoS via unlimited input) and [GHSA-r292-9mhp-454m](https://github.com/advisories/GHSA-r292-9mhp-454m) (Uncontrolled recursion stack-overflow DoS in `mediasoup` extraction).

Before remediation, running `npm audit --omit=dev --audit-level=critical` failed with exit code `1`. The red baseline evidence was captured in:
- `evidence/security036-audit-critical-red.txt` (exit code 1)
- `evidence/security036-production-audit-before.json` (metadata: 2 critical, 10 high, 14 moderate, 1 low)

---

## 2. Remediation Strategy and Semver Compatibility

In accordance with `GLOBAL_DEV_POLICY.md` and the task specifications:
- **No `--force` flag** was used.
- **No incompatible overrides** or major version jumps of Angular (17) or NestJS (10) were forced.
- **No tests, gates, or packages** were bypassed or excluded.

The critical advisories were resolved via compatible semver in-range updates:
- **`proxy-addr`**: Updated from `2.0.7` to `2.0.8`. Express requires `"proxy-addr": "~2.0.7"`, which permits `2.0.8`.
- **`tar`**: Updated under `@naughtybox/streaming` / `mediasoup` from `7.5.11` to `7.5.22`. Mediasoup requires `"tar": "^7.4.4"`, which permits `7.5.22`.

Lockfile reproducibility was verified using `npm ci --ignore-scripts` with an isolated cache directory.

---

## 3. Continuous Integration Gate (`.github/workflows/runtime.yml`)

A mandatory critical vulnerability gate has been added to `.github/workflows/runtime.yml`:
```yaml
      - run: npm ci --ignore-scripts
      - name: Critical dependency security gate
        run: |
          set -euo pipefail
          npm audit --omit=dev --audit-level=critical | tee evidence/security036-audit-ci.txt
```

Key operational design decisions:
- `set -euo pipefail`: Guarantees that any failure in `npm audit` causes the GitHub Actions step to exit non-zero immediately, preventing `tee` from masking the failure code.
- Zero-removal: All pre-existing build, test, MediaMTX synthetic streaming, mock E2E, and diagnostic steps were preserved intact.
- Evidence retention: Artifact upload includes `evidence/security036-*-ci.*`.

---

## 4. Verification and Machine Evidence

All validation suites were executed locally against the worktree with isolated caching:

1. **Production Critical Audit Gate:**
   - Command: `npm audit --omit=dev --audit-level=critical`
   - Exit code: **0** (PASSED, 0 critical vulnerabilities).
   - Evidence: [`evidence/security036-audit-critical-green.txt`](file:///C:/Users/Hokaido/Documents/NaughtyBox-security36/evidence/security036-audit-critical-green.txt)
   - Detailed JSON: [`evidence/security036-production-audit-after.json`](file:///C:/Users/Hokaido/Documents/NaughtyBox-security36/evidence/security036-production-audit-after.json) (critical count: 0).

2. **Deterministic Monorepo Build:**
   - Command: `npm run build:ci`
   - Exit code: **0** (All 4 monorepo packages built: `@naughtybox/shared-types`, `@naughtybox/backend`, `@naughtybox/streaming`, `@naughtybox/frontend`).
   - Evidence: [`evidence/security036-build-ci.txt`](file:///C:/Users/Hokaido/Documents/NaughtyBox-security36/evidence/security036-build-ci.txt)

3. **Unit Tests Suite:**
   - Command: `npm run test:units`
   - Exit code: **0** (11/11 tests passed: 9 presence domain tests + 2 runtime contract tests).
   - Evidence: [`evidence/security036-units.txt`](file:///C:/Users/Hokaido/Documents/NaughtyBox-security36/evidence/security036-units.txt)

4. **Mocked Browser E2E Suite (Playwright):**
   - Command: `CI=1 PLAYWRIGHT_USE_WEBSERVER=1 NG_CLI_ANALYTICS=false npx playwright test`
   - Exit code: **0** (3/3 passed: lobby to room shell, offline/preparing room state loop, studio broadcast route reachability).
   - Evidence: [`evidence/security036-e2e-mock.txt`](file:///C:/Users/Hokaido/Documents/NaughtyBox-security36/evidence/security036-e2e-mock.txt)

5. **Real Synthetic WebRTC Media Smoke Test:**
   - Command: `NAUGHTYBOX_MEDIA_SMOKE=1 node scripts/smoke-webrtc.mjs`
   - Exit code: **0** (`{"event":"synthetic_media_passed","video":{"width":320,"height":240},"tracks":["Opus","H264"],"stopped":true}`).
   - Evidence: [`evidence/security036-media-smoke.json`](file:///C:/Users/Hokaido/Documents/NaughtyBox-security36/evidence/security036-media-smoke.json) (Executed against local MediaMTX daemon without restarting it, using synthetic fake devices only).

---

## 5. Residual Vulnerabilities and Migration Roadmap

Resolving the 2 critical vulnerabilities reduced total production advisories from 27 to 25.
The remaining 25 vulnerabilities (10 High, 14 Moderate, 1 Low) cannot be patched via transitive micro-updates without breaking framework contracts:

### A. Angular Framework Stack (High/Moderate)
- **Packages:** `@angular/core`, `@angular/common`, `@angular/compiler`, `@angular/forms`, `@angular/platform-browser`, `primeng`.
- **Advisories:** XSS in i18n attribute bindings ([GHSA-g93w-mfhg-p222](https://github.com/advisories/GHSA-g93w-mfhg-p222)), SVG Script sanitization bypass ([GHSA-jrmj-c5cx-3cw6](https://github.com/advisories/GHSA-jrmj-c5cx-3cw6)), `HttpTransferCache` token leakage ([GHSA-58c5-g7wp-6w37](https://github.com/advisories/GHSA-58c5-g7wp-6w37)).
- **Constraint:** Remediation requires upgrading from Angular 17 to modern Angular LTS (v19/v20/v21). This is a major breaking change requiring migration of PrimeNG 17 and component template syntax.
- **Plan:** Dedicated frontend framework upgrade issue with end-to-end visual regression testing.

### B. NestJS Framework & Express Stack (High/Moderate)
- **Packages:** `@nestjs/core`, `@nestjs/platform-express`, `multer`, `body-parser`.
- **Advisories:** Multer DoS via incomplete cleanup and recursion ([GHSA-xf7r-hgr6-v32p](https://github.com/advisories/GHSA-xf7r-hgr6-v32p)), Body-parser size limit bypass ([GHSA-v422-hmwv-36x6](https://github.com/advisories/GHSA-v422-hmwv-36x6)).
- **Constraint:** Requires upgrading NestJS 10 to NestJS 11/12 and Express 5, which alters multipart upload handlers and controller decorators.
- **Plan:** Dedicated backend runtime upgrade issue with API integration testing.

### C. Realtime WebSocket Transport Stack (High)
- **Packages:** `ws`, `engine.io`, `socket.io-parser`.
- **Advisories:** `ws` memory exhaustion DoS ([GHSA-96hv-2xvq-fx4p](https://github.com/advisories/GHSA-96hv-2xvq-fx4p)), uninitialized memory disclosure ([GHSA-58qx-3vcg-4xpx](https://github.com/advisories/GHSA-58qx-3vcg-4xpx)).
- **Constraint:** Upgrading `engine.io-client` transitively introduced `MapIterator` typescript definition incompatibility under Angular 17 compiler (`TS2552: Cannot find name 'MapIterator'`).
- **Plan:** Align client and gateway versions during the coordinated Angular+NestJS framework upgrade.

---

## 6. Clear Limits and Release Boundary

> [!WARNING]
> **Crítica resuelta ≠ producto listo ni certificación de seguridad completa.**
> 
> Resolving the 2 critical vulnerabilities eliminates immediate remote IP-spoofing and tar-parser crash attack vectors in local testing. However, the application retains 10 High vulnerabilities in its core frameworks that require major architectural migrations before any production deployment or external public exposure can be considered.
