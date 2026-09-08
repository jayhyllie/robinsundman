# Sundman Events

Platform for live event experiences — currently hosting the ÖIK Business Club Challenge quiz. Prediction features will live under `/tips`.

## Stack

- **T3**: Next.js 15 (App Router), tRPC, TanStack Query, Prisma, PostgreSQL, Tailwind CSS v4
- **UI**: [shadcn/ui](https://ui.shadcn.com) with ÖIK theme (dark green `#0a120e`, primary `#a4c639`, accent `#ffd700`)
- **Auth**: Clerk (Google sign-in for admins)
- **Real-time**: Socket.io (separate server for Railway/Fly.io)
- **Runtime**: [Bun](https://bun.sh)

## Quick start

### 1. Environment

```bash
cp .env.example .env
# Fill in Clerk keys and secrets
```

### 2. Database (Docker)

```bash
./start-database.sh
bun run db:push
bun run db:seed
```

### 3. Install & run

```bash
bun install
bun run dev:all
```

- Web app: http://localhost:3000
- Socket server: http://localhost:3001

## ShadCN components

Installed: `button`, `input`, `label`, `select`, `card`, `badge`, `dialog`, `dropdown-menu`, `table`, `tabs`, `textarea`, `separator`, `avatar`, `progress`, `sheet`, `sonner` (toast)

Theme customized in `src/styles/globals.css` for ÖIK colors.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Sundman Events landing |
| `/quiz` | Business Club public dashboard |
| `/quiz/live` | Active quiz + QR for jumbotron |
| `/quiz/join/[code]` | Player join (mobile) — company + name |
| `/quiz/play/[sessionId]` | Live quiz player view (mobile) |
| `/quiz/leaderboard` | Public leaderboards |
| `/quiz/leaderboard/[sessionId]` | Live session standings |
| `/quiz/admin` | Admin dashboard (Clerk protected) |
| `/quiz/admin/quizzes` | Quiz CRUD, launch sessions |
| `/quiz/admin/quizzes/[id]/host` | Host panel — start questions, judge free text |
| `/quiz/admin/companies` | Manage companies/teams |
| `/quiz/admin/questions` | Question bank |
| `/quiz/admin/leaderboards` | Reset season/monthly leaderboards |

Legacy paths (`/join/*`, `/play/*`, `/leaderboard/*`, `/admin/*`) redirect to the `/quiz/...` equivalents.

## Game flow

1. Admin creates quiz from question bank (draft or scheduled)
2. Admin launches session → unique join code + QR
3. Players scan QR, enter company + name (lobby only)
4. Admin starts each question manually
5. 10s server-authoritative timer; fastest correct answers score up to 1000 pts
6. Correct answer revealed; admin advances to next question
7. Free-text questions: admin reviews and awards points
8. Scores update individual + company leaderboards

## Deployment

### Vercel (Next.js)

- Set all `NEXT_PUBLIC_*` and server env vars from `.env.example`
- `DATABASE_URL` → hosted PostgreSQL (Neon, Railway, etc.)
- `SOCKET_SERVER_URL` / `NEXT_PUBLIC_SOCKET_URL` → Railway/Fly socket server URL

### Railway / Fly.io (Socket server)

```bash
cd socket-server
# Set DATABASE_URL, CLIENT_URL, SOCKET_SERVER_SECRET, PORT
bun run build && bun run start
```

Ensure `SOCKET_SERVER_SECRET` matches the Next.js app and `CLIENT_URL` is your Vercel domain.

## Clerk setup

1. Create application at [clerk.com](https://clerk.com)
2. Enable Google OAuth
3. Add redirect URLs for local + production
4. Copy publishable + secret keys to `.env`

## Blockers

- **Docker**: Local Postgres requires Docker running for `./start-database.sh`
- **Clerk keys**: Required before `bun run dev` (or set `SKIP_ENV_VALIDATION=1` for build-only)
