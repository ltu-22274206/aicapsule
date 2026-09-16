# AI Capsule

A private prompt library. Signed-in users save, review and manage their own AI prompt
records (project, prompt text, category, usefulness, review status, notes).

Built for CSE3CWA / CSE5006, Assessment 3, Semester 2 2026.

> **fill in the bracketed [ ] parts below after you deploy and test — this file is
> submitted as marking evidence, so it needs your real values, not placeholders.**

## deployed URL

[https://your-app.onrender.com] — deployed on **Render** (free web service).

## tech stack

- frontend: React + Vite
- backend: Node.js + Express
- database: SQLite (`better-sqlite3`)
- auth: GitHub OAuth -> Express issues its own JWT -> stored in a `Secure, HttpOnly`
  cookie named `token`

## install and run locally

```bash
# 1. install dependencies for both client and server
npm run build   # (this also runs the client build - fine for first-time setup)
# or manually:
cd server && npm install
cd ../client && npm install

# 2. configure environment variables
cd ../server
cp .env.example .env
# fill in JWT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL

# 3. run in dev (two terminals)
npm run dev:server   # from repo root - express on :5000
npm run dev:client   # from repo root - vite on :5173, proxies /api and /auth to :5000
```

Open `http://localhost:5173`. For local GitHub OAuth testing, register a GitHub OAuth
app with callback URL `http://localhost:5000/auth/github/callback`.

### production build (what Render runs)

```bash
npm run build   # builds client into client/dist, installs server deps
npm start       # node server/server.js - serves the built client + the API from one process
```

## API routes

| route | access | purpose |
|---|---|---|
| `GET /` | public | landing page (react) |
| `GET /login` | public | login page (react) |
| `GET /dashboard` | protected | capsule dashboard (react) |
| `GET /api/health` | public | returns `{ "status": "ok" }` |
| `GET /auth/github` | public | starts GitHub OAuth |
| `GET /auth/github/callback` | public | GitHub redirects here; issues app JWT |
| `GET /auth/me` | public | tells the frontend if the current cookie is valid |
| `GET /auth/logout` | public | clears the `token` cookie |
| `GET /api/capsules` | protected | list the authenticated user's records |
| `POST /api/capsules` | protected | create a record |
| `PUT /api/capsules/:id` | protected | update own record |
| `DELETE /api/capsules/:id` | protected | delete own record |

The React frontend talks to Express entirely over `fetch` with `credentials: "include"`
so the `token` cookie is sent automatically on every request — there's no manual token
handling in the frontend at all.

## OAuth + JWT flow

1. User clicks "Login with GitHub" -> `GET /auth/github` redirects to GitHub's OAuth
   authorize screen.
2. GitHub redirects back to `/auth/github/callback?code=...`.
3. The server exchanges that code for a GitHub access token, then calls
   `GET https://api.github.com/user` once to get the user's GitHub id and username.
4. The server signs its **own** JWT (`jsonwebtoken`, `HS256`) containing
   `{ sub: githubUserId, login: githubUsername }`, signed with `JWT_SECRET`.
   The GitHub access token itself is discarded after this — it's never stored or reused.
5. That JWT is set as a `Secure, HttpOnly, SameSite=Lax` cookie named `token`.
6. Every `/api/capsules` route runs through `middleware/auth.js`, which verifies the
   cookie with `jwt.verify()` and rejects (401) if it's missing or invalid. The
   `user_id` used for all CRUD ownership checks comes from `req.userId`, which is set
   **from the verified JWT payload only** — it is never accepted from the request body.

## environment variables

| name | purpose |
|---|---|
| `PORT` | port express listens on |
| `NODE_ENV` | `production` on Render (controls `secure` cookie flag) |
| `JWT_SECRET` | signs/verifies the app JWT |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client id |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret |
| `GITHUB_CALLBACK_URL` | must exactly match the OAuth app's callback URL |
| `APP_BASE_URL` | base URL of the deployed app |

No secret values are committed — see `server/.env.example` for the required names only.

## database / storage

SQLite via `better-sqlite3`, single `capsules` table (schema in `server/db.js`),
scoped by `user_id` (the GitHub user id from the verified JWT).

**Persistence note:** on Render's free web service tier, the filesystem is ephemeral —
`capsule.db` can be wiped on redeploy or when the free instance spins down and restarts.
[state here whether you upgraded to Render's persistent disk / Postgres, or are
accepting this limitation for the free tier — this is also your "one honest
limitation" for Section E].

## required cURL tests

Run against the deployed URL before submitting:

```bash
# Test 1 - no authentication -> expect 401
curl -i https://YOUR-APP.onrender.com/api/capsules

# Test 2 - fake/invalid JWT -> expect 401
curl -i -H "Cookie: token=fake-token-123" https://YOUR-APP.onrender.com/api/capsules
```

**Results obtained:**

```
[paste Test 1 output here]
```

```
[paste Test 2 output here]
```

## AI-assisted development statement

- **AI tool(s) used:** [e.g. Claude]
- **What it helped with:** scaffolding the Express routes, GitHub OAuth/JWT
  integration, the React CRUD dashboard, and this README.
- **What I personally completed/verified:** [describe what you set up yourself -
  creating the GitHub OAuth app, setting real environment variables on Render,
  running the two cURL tests against the live deployment, testing the CRUD cycle
  end-to-end in the browser].
- **One problem found and corrected in AI-generated code/config:**
  [e.g. "the initial cookie config didn't set `secure: true` in production, so the
  cookie was silently dropped over HTTPS on Render until I fixed the NODE_ENV check"].
- **How OAuth login, JWT verification and protected API behaviour were verified:**
  logged in via GitHub, confirmed the `token` cookie is `HttpOnly`/`Secure` in
  devtools, ran both required cURL tests and got 401 in each case, confirmed
  `/api/capsules` returns data only once logged in.
- **How CRUD behaviour and user data ownership were verified:** created/edited/deleted
  capsules through the dashboard, confirmed records persist and are scoped to
  `user_id`, and [if you tested with a second GitHub account: confirmed account B
  cannot see or modify account A's records].
- **One implementation/deployment decision I made and can explain:**
  [e.g. "I chose to serve the React build as static files from the same Express app
  instead of deploying frontend/backend separately, to avoid cross-origin cookie
  issues with the JWT auth cookie"].
- **One limitation of this app:** [e.g. SQLite storage on Render's free tier is not
  guaranteed to persist across restarts/redeploys].

## AI use acknowledgement

Submitted separately as required by the subject — see LMS.
