# Leap Learner

Next.js 15 App Router frontend for the Leap Learner parent/child dashboard, tutor app, and admin CMS. It talks to a separate API (`NEXT_PUBLIC_API_URL`) through a same-origin proxy; JWTs are kept in httpOnly cookies and never reach browser JS.

## Setup

```bash
yarn
cp .env.example .env.local
```

Set `NEXT_PUBLIC_API_URL` to the API origin (used by the proxy and by Socket.IO). Set `API_URL` too if the server should reach the API on a different origin (e.g. an internal hostname). Optionally set `NEXT_PUBLIC_META_PIXEL_ID` for marketing analytics.

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | What it does |
| --- | --- |
| `yarn dev` | Next.js dev server |
| `yarn test` | Vitest unit tests |
| `yarn lint` | Next.js ESLint |
| `yarn typecheck` | `tsc --noEmit` (also runs during `yarn build`) |

## Layout

- `src/app/(dashboard)` — parent/child product
- `src/app/tutor` — tutor app
- `src/app/admin` — CMS / admin
- `src/lib/api` — React Query hooks (`queries.tsx` / `mutations.tsx` re-export domain files)
- `src/lib/auth` — session constants, cookie helpers, browser session helpers
- `src/app/api` — Next route handlers that own the session (see below)
- `src/middleware.ts` — server-side route gating

## Auth model

The API returns `accessToken` / `refreshToken` on sign-in; the frontend decides where they live.

- Each role signs in to its own bucket (`user`, `admin`, `tutor`) so several roles can be active in one browser.
- `axiosInstance` targets `/api/proxy/*` and sends `x-ll-role`. The proxy (`src/app/api/proxy/[...path]/route.ts`) reads the httpOnly cookie `ll_<bucket>_at`, adds `Authorization: Bearer …`, and streams the API response back. Sign-in / sign-up responses have their tokens moved into cookies and stripped from the JSON.
- On a 401 the client calls `POST /api/auth/refresh` (single in-flight refresh per tab); the server exchanges `ll_<bucket>_rt` for a new pair and rotates the cookies.
- `DELETE /api/auth/session?bucket=<bucket|all>` signs out. `GET /api/auth/session` reports which buckets have a session.
- A non-secret marker cookie `ll_<bucket>_session=1` lets client code (`hasSession`) and the guards know a session exists without a round-trip.
- `GET /api/auth/socket-token` returns the access token for the Socket.IO `jwtToken` handshake. It is the only place a token is exposed to page JS and should be removed once the socket gateway accepts cookie or ticket auth.
- `localStorage` keys `user` / `admin` / `tutor` hold only the token-free profile (name, role, offerType) for UI reads.
