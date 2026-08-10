# Admin Panel — Complete Project Plan

| | |
|---|---|
| Project | `project_d_admin` — **completely separate project** (own repo, own nginx, own compose, own CI) |
| API backend | `EhsanRezaie/project_d` (`/home/ehsan/Desktop/project-d`) — FastAPI, existing admin API |
| Panel location | `/home/ehsan/Desktop/project-d-admin` |
| Stack | Vite + React + TypeScript (static SPA) |
| Serving | Panel-owned nginx at `http://<server>:8443`, proxies `/api/v1` to the backend |
| Auth | Admin JWT via `POST /api/v1/admin/login` (60-min, no refresh; re-login) |
| Status | **M1–M5 complete, live** — backend fixes merged, panel built + deployed to `http://87.107.5.88:8443`, own CI deploys on every `main` push |

## 0. Boundaries (important)

- The admin panel is an **independent project**. It owns **everything** it needs: its own
  `docker-compose.yml`, its own `nginx.conf`, its own CI, its own serving port.
- The **backend (`project-d`) receives API fixes only** — bug fixes and endpoint work.
  **No changes** to the backend's `docker-compose.yml`, `nginx/nginx.conf`, deploy pipeline,
  `.gitignore`, or any infrastructure config.
- Currently deployed on the same VPS for convenience; later it can move to a separate server
  with **no code changes** — backend connectivity is a config/env value in this project.

## 1. Goals

- Give admins a web console to: **answer tickets**, **review reports**, **moderate photos**,
  **manage users**, **send announcements**, **view statistics/charts**, **audit log**, and
  **ops controls** (maintenance/version).
- Reuse the **existing** `/api/v1/admin/*` JSON API; fix only the small gaps that block a usable panel.
- Self-contained static SPA behind the panel's own nginx — light, fast, independently deployed.

## 2. Non-goals (v1)

- No multi-admin roles/permissions (single `ADMIN_USERNAME` — future).
- No admin chat threads (ticket = one `admin_response` today — fine for v1).
- No revenue/payments dashboard (no payments table yet; `Subscription` has `source`/`payment_id` only — future).
- No Grafana/Prometheus UI in the panel.

## 3. Backend admin API surface (verified)

From `app/main.py:138–170`, admin routers mounted under `/api/v1`:

| Router | Key endpoints |
|---|---|
| `admin` (auth) | `POST /admin/login` (5/min limit) |
| `admin/users` | list+filters, detail+stats, PATCH activate/deactivate, DELETE, `POST {id}/premium`, `GET {id}/activity`, `POST {id}/message` |
| `admin/dashboard` | overview; `/stats/users`, `/stats/activity`, `/stats/reports`, `/stats/tickets` |
| `admin/tickets` | list(filter), detail, PATCH respond/status, DELETE |
| `admin/reports` | list(filter), detail, PATCH review/action, DELETE |
| `admin/photos` | `GET /pending`, `POST {id}/approve\|reject`, `POST {id}/verify-face`, `GET /stats`, `GET {id}`, `GET /users/{uid}/photos` |
| `admin/announcements` | broadcast all/premium, `/test` |
| `admin/messages` | `GET {id}/decrypt`, `DELETE {id}`, `GET /reports/{rid}/message` |
| `admin/face-verification` | `/test` (debug pipeline) |
| `system` (ops) | maintenance enable/disable/status; version set-minimum/force-update/config/override |

Supporting: `GET /health/ready`, `GET /metrics` (internal-only, nginx 403), `admin_logs` table (write-only today).

## 4. Backend changes (`project-d`) — API code only

### 4.1 Decouple `get_admin_user` from the fake `admin@test.com` DB row

- **File:** `app/core/deps.py:258–292`.
- Today: JWT/X-Admin-Key is validated, **then** a `users` row with email `admin@test.com` must exist
  or every request → 403. This couples "admin" to a fake app account.
- **Change:** `get_admin_user` returns a light `AdminIdentity` (dataclass) with `.id` = the admin
  username from the admin JWT (`sub`) or `settings.ADMIN_USERNAME` for the X-Admin-Key path; no DB
  lookup. All call sites use only `admin.id` (`str(admin.id)` in logs, `admin.id` for `from_admin`
  sends), so this is compatible.

### 4.2 Add `GET /api/v1/admin/logs` (audit reader)

- **File:** new `app/api/v1/endpoints/admin_logs.py` (register in `app/main.py`).
- Query: `GET /admin/logs?admin_id=&action=&target_type=&target_id=&from=&to=&page=&page_size=` (cap 50).
- Returns ordered `admin_logs` rows (id, admin_id, action, target_type, target_id, ip_address,
  created_at) + total count. Auth: `get_admin_user`.

### 4.3 Migrate `/system` admin ops to `get_admin_user`

- **File:** `app/api/v1/endpoints/system.py`. The 7 admin routes (`maintenance/enable|disable|status`,
  `version/set-minimum|force-update|config|override`) use a separate `check_admin_auth`
  (X-Admin-Key only) at lines 129–132.
- **Change:** swap to `Depends(get_admin_user)` — which already accepts JWT **and** X-Admin-Key
  (`deps.py:280`), so existing tooling keeps working. Drop `check_admin_auth`. The panel uses its
  JWT for ops pages and never holds `ADMIN_SECRET_KEY`.
- `/system/status` + `/system/version-check` stay **public** (client splash logic).

### 4.4 Admin credentials (one-time server step — secrets, cannot live in repo)

- `.env.example`: document `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` (bcrypt).
- Server `/opt/demo-bondi/.env`: set `ADMIN_USERNAME=<admin>`, generate the hash with:

  ```bash
  docker compose run --rm app python -c "from app.core.security import hash_password; print(hash_password('<pw>'))"
  ```

  then set `ADMIN_PASSWORD_HASH=<hash>` and restart the `app` container.
  `/admin/login` then returns a JWT instead of 503.

### 4.5 Tests (backend)

- `tests/done/` additions: admin login happy path + wrong-password 401 + missing-config 503;
  `get_admin_user` with JWT (no DB row) → 200; `GET /admin/logs` filtering; system maintenance/version
  routes accept JWT (and still accept X-Admin-Key). CI runs `pytest tests/done/` + `alembic check`
  (no schema change → no migration needed).

### 4.6 Optional opportunistic fix (API code)

- `app/main.py:127` — celery-queue-depth gauge reads Redis key `"celery"` but the queue is `"bondi"`
  (`celery_app.py:18`) → gauge always 0. Fix to the configured queue name.

## 5. This project (`project_d_admin`)

### 5.1 Repo layout

```
project-d-admin/
  PLAN.md               # this plan
  src/                  # Vite + React + TS SPA
  nginx/
    nginx.conf          # THIS panel's own nginx config (SPA + /api/v1 proxy)
  docker/
    Dockerfile          # nginx image serving the built SPA (optional; compose-based)
  docker-compose.yml    # panel-owned: nginx container (port 8443) + optional build step
  .env.example          # BACKEND_ORIGIN, port, etc. (panel's own config, not the backend's)
  .github/workflows/    # own CI (build + ship + compose up on VPS)
```

The panel does **not** depend on the backend's nginx, compose, or deploy files.

### 5.2 Nginx (panel-owned)

`nginx/nginx.conf` (this project, served by this project's container):
- Serve the built SPA from `/usr/share/nginx/html`.
- Proxy `/api/v1/` to the backend via a configurable upstream
  (`BACKEND_ORIGIN` env → `proxy_pass`), so the panel is same-origin to its API → no CORS,
  and moving servers later = changing one env value.
- SPA fallback: `try_files $uri /index.html;`.

### 5.3 Stack (rationale)

- **Vite + React + TS** — static SPA, instant dev server, small build; React’s admin ecosystem
  (tables, filters, forms, charts) is the fastest way to build CRUD pages; full TS against
  pydantic-shaped JSON. Dark theme.
- Deps: `react`, `react-router-dom`, `axios`, `recharts`, **Ant Design** for UI, `react-query`
  (or plain hooks) for caching.

### 5.4 Typed API client

- Production disables `openapi` on the backend (`main.py:66`), so snapshot `openapi.json` from a
  dev instance into this repo (checked in) and run `openapi-typescript` at build/CI to emit
  `src/api/types.ts`. API base URL is relative (`/api/v1`) because of the panel's own nginx proxy.

### 5.5 Auth flow

- Login page → `POST /admin/login` (5/min limit — surface 429 cleanly). Store JWT in `localStorage`
  (internal tool). Axios interceptor: 401 → clear token → redirect `/login`. Token TTL 60 min, no
  refresh — re-login on expiry (show a hint).
- Guard: protected routes render only with a token; bootstrap check via `GET /admin/dashboard`.

### 5.6 Pages & wired endpoints

1. **Login** — `/admin/login` (username/password).
2. **Dashboard** — `/admin/dashboard` KPI cards (total/active/new/premium %, today’s swipes/matches/messages,
   pending photos/reports, open tickets); recharts line/bar: `/stats/users`, `/stats/activity`;
   donut: `/stats/reports`, `/stats/tickets`. Date-range selector (N-day param).
3. **Users** — `/admin/users?search&is_active&is_premium` table w/ filters + pagination → detail
   `/admin/users/{id}` (stats: likes/matches/messages/reports) → activate/deactivate, grant premium,
   per-user activity chart `/admin/users/{id}/activity`, send notification `/admin/users/{id}/message`.
4. **Photo moderation** — queue `/admin/photos/pending` with image preview (use `S3_PUBLIC_BASE_URL`
   of the backend), approve `/approve`, reject w/ reason `/reject`, face-verify `/verify-face`;
   moderation stats `/admin/photos/stats`.
5. **Reports** — `/admin/reports?status` list → detail `/admin/reports/{id}` incl. linked message via
   `/admin/messages/reports/{id}/message` (decrypted) → review/action PATCH → resolve.
6. **Tickets** — `/admin/tickets?status` list → detail `/admin/tickets/{id}` → respond/close PATCH → delete.
7. **Announcements** — broadcast form (all / premium-only) `/admin/announcements`, test send
   (target user field).
8. **Audit log** — new `/admin/logs` (filters + table) per §4.2.
9. **System (Ops)** — maintenance enable/disable/status, version set-minimum / force-update / override
   (JWT-authed per §4.3).
10. **Messages moderation** — `/admin/messages/{id}/decrypt`, `/admin/messages/{id}` DELETE.

## 6. Deployment & CI/CD (this project)

### 6.1 Serving (same VPS for now)

- Panel container binds host port **8443** (`http://87.107.5.88:8443`), project dir `/opt/bondi-admin`.
- Does not touch the backend ports (80/443), glitchtip (8080), or invite-site (8143).

### 6.2 Own CI (`.github/workflows/deploy.yml`, secrets: `VPS_HOST`, `VPS_USERNAME`, `VPS_PASSWORD`)

- Trigger: `push main`. Steps: `npm ci` → `vite build` (types via openapi-typescript) → SSH to VPS →
  rsync build + config to `/opt/bondi-admin/` → `docker compose up -d --build` in that dir.
  Independent of the backend pipeline.

### 6.3 Portability (future separate server)

- Change `BACKEND_ORIGIN` (nginx upstream env) and re-run the same compose/CI. No code changes.

### 6.4 Rollback

- Panel: previous build on disk, `docker compose up -d --force-recreate`. API: untouched (backend's
  existing rollback mechanism).

## 7. Security notes

- Panel JS never holds `ADMIN_SECRET_KEY` → ops endpoints migration to JWT (§4.3) is **required**, not optional.
- Never commit `.env`/tokens; all panel secrets come from GitHub secrets or the server's `.env`.
- Keep backend login rate limit (5/min); admin JWT short-lived (60 min).
- Panel nginx proxies only `/api/v1` to the backend; other backend paths stay out of reach.

## 8. Milestones

1. **M1 Backend API fixes** — §4.1–4.4 (+ tests); deploys via the backend pipeline; server `.env`
   credentials; verify `/admin/login` → 200. (Backend infra untouched.)
2. **M2 Panel scaffold** — Vite+React+TS repo, auth, layout, dashboard, own nginx + compose skeleton.
3. **M3 Feature pages** — Users, Photos, Reports, Tickets.
4. **M4 Remaining pages + ops** — Announcements, Audit log, System, Messages.
5. **M5 Deploy & polish** — panel CI, port 8443 serving, i18n touch-up, UAT on the VPS.

## 9. Risks / decisions

- Admin session 60-min expiry w/o refresh → re-login friction; acceptable v1.
- Ticket threads are single-response (no conversation); flag in UI copy.
- Port 8443 is plain HTTP for now (matches invite-site pattern); TLS/domain later on a separate server.
- VPS has 2 CPU — panel is static assets only, negligible load; backend workers already auto-scaled to 5.

## 10. Files summary

- **Backend fixes (`project-d`):** `app/core/deps.py`, new `app/api/v1/endpoints/admin_logs.py`,
  `app/main.py` (register router; optional metrics key), `app/api/v1/endpoints/system.py`,
  `.env.example`, `tests/done/test_admin*.py`. Nothing else.
- **This project:** Vite app (§5.1/5.6), own `nginx/nginx.conf` + `docker-compose.yml`, CI §6.2.

## 11. Progress log

- **M1 (backend, `project-d` → `b47603a`):** all §4 backend changes done + tested (full suite
  737 passed, CI deploys via the existing pipeline). Remaining server step: set
  `ADMIN_USERNAME`/`ADMIN_PASSWORD_HASH` in `/opt/demo-bondi/.env` (see §4.4) for
  `/admin/login` to return a JWT.
- **M2 (panel scaffold, this repo):** Vite+React+TS app committed and verified build:
  `npm run typecheck` + `npm run build` pass locally. Auth (`/admin/login` JWT flow +
  axios 401 interceptor), protected routing, Ant Layout w/ sidebar, Dashboard (KPI cards +
  14-day new-users area chart). Own `nginx/nginx.conf.template` (env-subst
  `BACKEND_ORIGIN` proxy + SPA fallback + cache headers), `Dockerfile` (nginx-alpine +
  envsubst entrypoint), `docker-compose.yml` (port **8443**, `./dist` volume mount),
  `.env.example`, and own `.github/workflows/deploy.yml` (install → typecheck → build →
  scp → `docker compose up -d --build`). Pages beyond Dashboard are placeholders pending M3/M4.
- **M3 (feature pages, this repo):** Users (list + search/active/premium filters + pagination;
  detail drawer with activity chart, activate/deactivate, grant premium, send notification,
  delete), Photo moderation (pending queue with preview + stats, approve/reject-with-reason/
  verify-face, load more), Reports (status filter + detail drawer + status/note update + delete),
  Tickets (status filter + pagination; detail drawer + respond/close/in-progress + delete).
  Dashboard rewired to the real `/admin/dashboard` shapes (KPI cards + user-growth/activity
  charts + report/ticket status stats).
- **M4 (remaining pages, this repo):** Announcements (broadcast all/premium-only + single-user
  test sender), Audit log (admin/action/target-type/target-ID/date-range filters + pagination),
  System (maintenance enable-with-message/disable/status + version control: set min android/ios,
  force-update toggle + message, clear overrides), Messages (decrypt via message ID + delete for
  everyone + view reported message by report ID). Route-level code-splitting (each page is a lazy
  chunk; initial bundle ~775 kB / 251 kB gzip). All pages hit the exact backend shapes mapped in
  `src/api/types.ts`.
- **M5 (deploy & CI/CD, live):** Panel deployed to the VPS at `/opt/bondi-admin`, served on
  `http://87.107.5.88:8443`. Own GitHub Actions (`deploy.yml`): install → typecheck → build →
  scp → `docker compose up -d --build` on every `main` push; secrets `VPS_HOST`/`VPS_USERNAME`/
  `VPS_PASSWORD` set on the repo. Backend admin auth enabled server-side (`.env`:
  `ADMIN_USERNAME=admin` + bcrypt `ADMIN_PASSWORD_HASH`, hash generated via the app container),
  `/admin/login` verified 200 via both backend nginx and the panel proxy; protected endpoints
  (dashboard, logs) verified 200 with the admin JWT. Nginx issues found on first deploy and
  fixed in-repo: `envsubst` scoped to `$BACKEND_ORIGIN` (bare envsubst clobbered nginx `$vars`),
  healthcheck targets `127.0.0.1` (`localhost` resolves to `::1` inside the container). Backend
  celery worker recovered from a Compose-v5 interpolation bug (shell `$vars` need `\$\$`
  escaping; backend commit `6d99727`) — all containers healthy. Panel login:
  `admin` / password from `/tmp/admin_pw.txt` on the dev machine.