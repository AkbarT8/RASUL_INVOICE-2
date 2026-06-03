# AGENTS.md

## Cursor Cloud specific instructions

### Product

Premium personal **Proforma Management System** (React + Vite + TypeScript + Tailwind). Private workspace for clients, proformas, dynamic spreadsheet columns, Excel export, and global search.

### Services

| Service | Required | Notes |
|---------|----------|--------|
| Node.js 22+ | Yes | App toolchain |
| Netlify CLI | Optional | `npm run dev` (functions + Vite proxy) or static deploy |
| Netlify Functions | Optional | Enable with `VITE_USE_API=true` in `.env` for server-backed storage |

Default local/production-static mode uses **browser localStorage** (no backend required).

### Commands

| Task | Command |
|------|---------|
| Install | `npm install` |
| Dev (API + UI) | `npm run dev` → http://localhost:8888 (API). If Vite modules fail on 8888, use http://localhost:5173 for UI while API stays on 8888. |
| Dev (UI only) | `npm run dev:vite` → http://localhost:5173 |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Production preview | `npx netlify serve` |

### Login (default)

- **Username:** `admin`
- **Password:** `Proforma2026!`

Override via `VITE_ADMIN_USERNAME` / `VITE_ADMIN_PASSWORD` (build-time) or `ADMIN_USERNAME` / `ADMIN_PASSWORD` (Netlify Functions).

### Netlify deploy

Authenticated deploy (recommended, no Drop password gate):

```bash
export NETLIFY_AUTH_TOKEN=...
npm run build
npx netlify deploy --prod --dir=dist
```

For server persistence on Netlify, set `VITE_USE_API=true` at build time and deploy **with** `netlify/functions` (requires authenticated Netlify account).

Anonymous static deploy (no token): functions folder must be absent or renamed; site uses localStorage only.

### Gotchas

- `netlify dev` on port 8888 may serve `text/html` for Vite HMR paths; use port **5173** for frontend during local dev if that happens.
- Data in static mode is per-browser (localStorage), not shared across devices.
- `.data/` holds local JSON when using API mode without Netlify Blobs.
