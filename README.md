# Leap Learner

Next.js 15 App Router frontend for the Leap Learner parent/child dashboard, tutor app, and admin CMS. It talks to a separate API (`NEXT_PUBLIC_API_URL`). Auth is still JWT-based (`user` / `admin` / `tutor` in `localStorage`).

## Setup

```bash
yarn
cp .env.example .env.local
```

Set `NEXT_PUBLIC_API_URL` to the API origin. Optionally set `NEXT_PUBLIC_META_PIXEL_ID` for marketing analytics.

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
