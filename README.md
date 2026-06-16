# Goodness Gardens — Food Safety Management System (FSMS)

A **standalone** Next.js app for Food Safety & Quality, fully separate from the OpsExpanded portal:
its own code, its own database, its own logins, its own Vercel project and URL.

## What's inside
- **Document Register** — the 83-document controlled-document index (SOPs, logs, forms) by Primus number, viewable and editable.
- **Primus Self-Audits** — PrimusGFS internal audit checklists (Modules 1–7), scored; non-compliances auto-open a deviation + CAPA.
- **Deviations & CAPA** — report a deviation → root cause analysis → corrective actions → close.
- **Checklists** — daily/inspection checks with submission history.
- **Admin** — manage users (its own accounts), set PINs, roles.

## Tech
Next.js 14 (App Router) · Neon Postgres · jose (JWT cookie auth) · bcryptjs. No training/benefits/HR — those stay in OpsExpanded.

## Deploy (its own Vercel project)
1. **Create a new GitHub repo** (e.g. `GoodnessGardens/gg-fsms`) and upload everything in this folder.
2. **Neon**: create a NEW database (separate from OpsExpanded) and copy its connection string.
3. **Vercel**: New Project → import the repo → add environment variables:
   - `DATABASE_URL` = the new Neon connection string
   - `AUTH_SECRET` = any long random string
   - `SETUP_TOKEN` = any secret you choose (used once to seed)
4. Deploy. Then visit **`/api/setup?token=YOUR_SETUP_TOKEN`** once. This creates the tables, seeds the
   83-document register + 16 checklists, and creates the first admin:
   - **ID:** `admin` · **PIN:** `0000` — change this immediately in Admin → Users.
5. Log in at `/login`, open **Admin** to add your FS staff and set their PINs.

## Notes
- Document PDFs live in `public/fsdocs/`.
- Re-running `/api/setup` is safe — it preserves edited documents and checklist changes, and only resets the `admin` PIN.
