# Proforma Workspace

Premium personal proforma management system — clients, spreadsheet-style line items, dynamic columns, Excel export, and global search.

## Live site

**URL:** https://cosmic-biscochitos-078323.netlify.app

> **Netlify Drop access:** Anonymous deploys show a Netlify gate password first: `My-Drop-Site`  
> For a public URL without this gate, connect `NETLIFY_AUTH_TOKEN` and redeploy from your Netlify account.

## Application login

| Field | Value |
|-------|--------|
| Username | `admin` |
| Password | `Proforma2026!` |

## Features

- Minimal dark login
- Dashboard, clients (cards + table), search, settings
- Client folders with unlimited proformas
- Airtable-style spreadsheet: dynamic columns, row drag, multi-select, cell colors, auto-save
- Excel export (full table, selected rows, visible columns)
- Global search across clients, proformas, articles, and notes

## Local development

```bash
npm install
npm run dev        # Netlify dev (optional API on :8888)
# or
npm run dev:vite   # Frontend only on :5173 (localStorage mode)
```

## Build

```bash
npm run build
```

## Deployment (Netlify)

```bash
export NETLIFY_AUTH_TOKEN=your_token
npm run build
npx netlify deploy --prod --dir=dist
```

Set environment variables on Netlify for server-backed mode:

- `VITE_USE_API=true`
- `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`

## Tech stack

React 19, Vite 8, TypeScript, Tailwind CSS 4, Zustand, dnd-kit, ExcelJS, Netlify Functions (optional)
