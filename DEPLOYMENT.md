# NaayVadh — Deployment Guide

AI Legal Assistant for Indian Law. **FastAPI** backend + **React/Vite** frontend,
containerised with Docker and served behind nginx.

```
┌────────────┐      :80/:443      ┌──────────────────────────────┐
│  Browser   │ ─────────────────▶ │  frontend (nginx)            │
└────────────┘                    │   • serves the React SPA     │
                                  │   • proxies /api/* ──────────┼──▶ backend (uvicorn :8000)
                                  └──────────────────────────────┘            │
                                                                              ▼
                                                                   SQLite on a Docker volume
                                                                   (backend_data → /app/data)
```

The frontend talks to the backend through nginx (`/api` → `backend:8000`), so the
two containers share one origin — no CORS or hardcoded API URL needed.

---

## 1. Prerequisites

- Docker Engine 24+ and the Docker Compose plugin (`docker compose`)
- Ports: one public HTTP port (default **80**) on the host

## 2. Configure

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

| Variable          | Required | Notes                                                        |
|-------------------|----------|--------------------------------------------------------------|
| `JWT_SECRET_KEY`  | ✅       | Long random string. `python -c "import secrets;print(secrets.token_urlsafe(48))"` |
| `GEMINI_API_KEY`  | —        | Needed for AI replies. App runs without it (chat returns an error until set). |
| `DATABASE_URL`    | —        | Defaults to SQLite on the persistent volume.                 |
| `FRONTEND_PORT`   | —        | Host port for the web app (default `80`).                    |
| `CORS_ORIGINS`    | —        | Only for a separately hosted frontend (comma-separated).     |

## 3. Build & run

```bash
docker compose up -d --build
```

Then open `http://<server-ip>:<FRONTEND_PORT>` (default `http://<server-ip>/`).

Check status and logs:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

## 4. Verify

```bash
# Backend health (proxied through the frontend)
curl http://localhost:${FRONTEND_PORT:-80}/api/../health   # backend root
curl http://localhost:8000/health                          # if backend port is exposed

# Sign up a user (exercises the DB write path)
curl -X POST http://localhost/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test User","email":"test@example.com","password":"secret123"}'
```

A successful signup/login returning a JWT confirms the **frontend → nginx → backend → SQLite**
path is fully working.

## 5. Operations

```bash
docker compose down              # stop (data kept on the volume)
docker compose down -v           # stop AND delete the database volume
docker compose up -d --build     # redeploy after pulling new code
docker compose restart backend   # restart a single service
```

**Database backup** (SQLite lives on the `backend_data` volume):

```bash
docker compose exec backend sh -c "cp /app/data/naayvadh.db /app/data/backup-$(date +%F).db"
# or copy it out to the host:
docker cp naayvadh-backend:/app/data/naayvadh.db ./naayvadh-backup.db
```

## 6. Production notes

- **TLS/HTTPS**: terminate TLS at a reverse proxy in front of the `frontend` container
  (Caddy, Traefik, or an nginx with certbot). Point it at `FRONTEND_PORT` and set
  `FRONTEND_PORT` to an internal port like `8080`.
- **Secrets**: never commit `.env`. Rotate `JWT_SECRET_KEY` if it leaks (invalidates tokens).
- **Scaling**: SQLite suits single-node use. For multi-instance/high write loads, switch
  `DATABASE_URL` to Postgres (`postgresql+asyncpg://...`) and add the driver to
  `backend/requirements.txt` — no app code changes needed (SQLAlchemy async).

## 7. AI (Gemini) configuration

The AI chat, legal-report generation, case-precedent search, and chat titles are powered by
Google Gemini. Two env vars control it (see `.env`):

- `GEMINI_API_KEY` — your key (sent via the `X-goog-api-key` header).
- `GEMINI_MODEL` — defaults to `gemini-flash-latest`. Swap models here without touching code.

Notes:
- These are **thinking** models; the backend sends `thinkingConfig.thinkingBudget=0` so the
  full token budget goes to the answer (otherwise responses can come back empty). Transient
  `429`/`5xx` errors are retried automatically.
- **Quota matters for real users:** free-tier keys are capped (~20 requests/day for flash
  models) and a single full consultation (several follow-up turns + report + precedent search)
  uses ~6–10 requests. **Enable billing / use a paid-tier key for production.**
- The app degrades gracefully without a key (chat replies return an error message; auth,
  chat CRUD, and the database keep working).
