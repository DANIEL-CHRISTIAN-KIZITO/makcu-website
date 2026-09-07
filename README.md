# Makerere University Christian Union (MAK MAIN CU) Website

Website for Makerere Christian Union Fellowship — Node.js + Express + EJS + PostgreSQL.

## Features
- Public pages: Home, About, Events, Give (donations), Join (sign-up), Gallery, Contact
- Admin dashboard with role-based access: **superadmin** (full control, can manage other admins) and **editor**
- Events and gallery management (create/edit/delete, image upload)
- Sign-up list with CSV export
- Donation records (payment provider integration stubbed — see below)

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in real values:
   ```
   cp .env.example .env
   ```
   - `DATABASE_URL`: your Postgres connection string (works with your existing Docker Postgres setup)
   - `SESSION_SECRET`: any long random string
   - `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD`: set these to bootstrap your own superadmin account

3. Create the database (if it doesn't exist yet):
   ```
   createdb mak_cu_db
   ```
   Or via Docker/psql, whichever you already use for SBAFL.

4. Initialize the schema and bootstrap your superadmin account:
   ```
   npm run db:init
   ```

5. Run the app:
   ```
   npm run dev
   ```
   Visit http://localhost:3000, and http://localhost:3000/admin/login for the admin panel.

## Still to do (marked with TODO in code)
- **Branding**: drop your logo into `public/img/logo.png`, and update `--primary` / `--accent` colors in `public/css/style.css` to match MAK MAIN CU's real palette.
- **Content**: fill in mission statement, statement of faith, leadership bios, and meeting time/location in `views/about.ejs`.
- **Payment integration**: `views/give.ejs` and `routes/public.js` (`/give`, `/give/callback`) have the DB and route structure ready, but the actual Flutterwave/Paystack checkout widget still needs to be wired in — the code has comments marking exactly where.
- **Social links**: add real links in `views/contact.ejs`.
- Adding your second admin: once your own superadmin account works, log in and add the other admin from **Manage Admins** in the sidebar (superadmin-only).

## Adding a second admin
Only a superadmin can do this, via `/admin/admins` after logging in. You (Daniel) are set up as superadmin via the `.env` bootstrap; the other admin can be added with role "editor" (or "superadmin" if you want them to have equal control later).
