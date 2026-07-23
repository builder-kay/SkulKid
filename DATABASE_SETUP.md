# SkulKid Supabase Backend Setup

SkulKid uses Supabase exclusively for:

- PostgreSQL data
- Authentication and sessions
- Row-level security
- File storage
- Server-side administrative access

The application connects through the Supabase SDK and requires no direct
PostgreSQL connection string.

## 1. Create the project

Create a project at Supabase, then copy `.env.example` to `.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL="https://PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."

CLIFZE_API_KEY="..."
CLIFZE_SENDER_ID="SkulKid"
GEMINI_API_KEY="..."
```

Only the URL and publishable key may use the `NEXT_PUBLIC_` prefix. The
service-role, Clifze, and Gemini keys must remain server-only.

## 2. Build the database

Open Supabase Dashboard → SQL Editor and run the migrations in filename order:

```text
supabase/migrations/20260723150000_initial.sql
supabase/migrations/20260723160000_app_persistence.sql
```

The migrations create the curriculum, lessons, students, progress, quiz,
reward, badge, streak, profile/avatar, admin lesson, game-state, and dashboard
settings tables. They also create:

- the `auth.users` → `Student` profile trigger;
- foreign keys and integrity checks;
- automatic `updatedAt` triggers;
- published-content read policies;
- per-student row-level security;
- administrator policies based on `app_metadata.role`.

Run a migration only once on a database.

## 3. Authentication

Enable the Phone provider under Authentication → Providers. SkulKid uses
Clifze to send and verify signup/password-reset codes, then uses Supabase Auth
for phone/password sessions.

New signups receive:

```json
{ "role": "student" }
```

Assign administrators only from a trusted server or Supabase dashboard:

```json
{ "role": "admin" }
```

Never allow a browser request to assign `app_metadata`.

## 4. Vercel

Add the six environment values shown above to Development, Preview, and
Production in Vercel. No PostgreSQL connection string is required by the
application.

## 5. Security

- Browser components use the Supabase publishable key and are constrained by RLS.
- Route handlers use the service-role key only for trusted operations.
- `/api/admin/*` requires an authenticated administrator.
- XP, quiz grading, reward redemption, and lesson publishing must be calculated
  or validated server-side.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`.

## 6. Source locations

```text
lib/supabase/browser.ts       Browser Supabase client
lib/supabase/server.ts        Cookie-aware server client
lib/supabase/admin.ts         Server-only service-role client
supabase/migrations/          SQL migrations
app/api/auth/                 Authentication endpoints
middleware.ts                 Page and API access control
```
