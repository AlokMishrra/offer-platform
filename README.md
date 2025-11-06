# Offer Platform (Draft, Publish, Digital Sign)

A simple all-in-one website where:
- Admin drafts and publishes offer letters to specific employee IDs
- Employees enter their ID, view the offer, digitally sign, and submit
- Admin can manage employees and generate a company ID for onboarded employees

## Tech
- Node.js + Express
- EJS templates
- SQLite (file-based DB)

## Setup
1. Install Node.js 18+
2. Create `.env` (see `.env.example`)
3. Install deps and run

```bash
npm install
npm run dev
```

App: http://localhost:3000

- Employee portal: `/employee`
- Admin portal: `/admin` (default user: `admin`, password from `ADMIN_PASSWORD` or `admin123`)

## Environment
Create `.env` in project root:

```
PORT=3000
SESSION_SECRET=change_me
ADMIN_PASSWORD=admin123
```

## Notes
- SQLite DB file will be created at `src/storage/offer.db` automatically.
- This is an MVP; for production, add HTTPS, proper sessions, CSRF protection, and role-based access controls.

