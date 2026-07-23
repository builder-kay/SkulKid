# SkulKid Database and Backend Handoff

This document explains how to create the SkulKid PostgreSQL database, apply the existing Prisma schema, seed development data, and begin replacing the current browser-only persistence with a real backend.

## 1. Current state

SkulKid uses:

- PostgreSQL
- Prisma ORM 7
- `@prisma/adapter-pg`
- Next.js 15 App Router
- TypeScript

The database contract is [prisma/schema.prisma](prisma/schema.prisma). Prisma reads the connection string through [prisma.config.ts](prisma.config.ts).

The schema exists, but the main student and lesson-builder screens are **not database-backed yet**. They currently use `localStorage`. Do not assume that creating the database alone will make admin-created lessons available across browsers or devices.

## 2. Prerequisites

Install:

- Node.js 20 or newer
- npm
- PostgreSQL 15 or newer, or Docker

Confirm the tools:

```bash
node --version
npm --version
psql --version
```

## 3. Create PostgreSQL

### Option A: local PostgreSQL

Create a database and a dedicated application user:

```sql
CREATE ROLE skulkid_app WITH LOGIN PASSWORD 'replace-with-a-local-password';
CREATE DATABASE skulkid OWNER skulkid_app;
GRANT ALL PRIVILEGES ON DATABASE skulkid TO skulkid_app;
```

Run the SQL as a PostgreSQL administrator:

```bash
psql -U postgres
```

### Option B: Docker

```bash
docker run --name skulkid-postgres \
  -e POSTGRES_USER=skulkid_app \
  -e POSTGRES_PASSWORD=replace-with-a-local-password \
  -e POSTGRES_DB=skulkid \
  -p 5432:5432 \
  -v skulkid_postgres_data:/var/lib/postgresql/data \
  -d postgres:16
```

The named volume keeps the data when the container stops.

## 4. Configure environment variables

Create `.env` in the project root:

```env
DATABASE_URL="postgresql://skulkid_app:replace-with-a-local-password@localhost:5432/skulkid?schema=public"
```

Rules:

- Never commit `.env`.
- Never expose the connection string through a `NEXT_PUBLIC_` variable.
- Use separate databases for local development, preview/staging, and production.
- The fallback URL in `prisma.config.ts` is only a convenience for local development. Deployed environments must define `DATABASE_URL`.

The AI lesson-import routes also use:

```env
GEMINI_API_KEY="server-only-key"
GEMINI_MODEL="gemini-3.5-flash"
```

These AI variables are unrelated to database connectivity but are required if the backend engineer tests lesson extraction.

## 5. Install and initialise the database

From the project root:

```bash
npm install
npx prisma validate
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

There is currently no committed `prisma/migrations` directory. The first backend engineer should generate the initial migration, inspect the SQL, and commit the resulting migration files.

Open Prisma Studio to inspect the data:

```bash
npx prisma studio
```

Useful project commands:

```bash
npm run prisma:validate
npm run prisma:seed
npm run typecheck
npm run test
```

Always run `npx prisma generate` after changing `schema.prisma`. This is especially important before running `prisma/seed.ts`, because the seed imports generated Prisma enums such as `BadgeCategory`.

## 6. Production and Vercel

Set `DATABASE_URL` in the Vercel project for the correct environments:

- Development
- Preview
- Production

Apply committed migrations during deployment:

```bash
npx prisma migrate deploy
```

Do **not** use `prisma migrate dev` against production.

If the PostgreSQL provider supplies pooled and direct connection strings:

- Use the pooled connection for normal server requests.
- Use a direct connection for migrations and administrative jobs.
- Update `prisma.config.ts` deliberately if a second migration URL is introduced; the current project only reads `DATABASE_URL`.

Keep seed data out of production unless it is intentionally required. `prisma migrate deploy` does not run the seed automatically.

## 7. Existing domain model

### Curriculum and publishing

```text
Subject
  └── Unit
       └── Topic
            └── Lesson
                 └── LessonVersion
                      ├── LearningObjective
                      └── LessonBlock
```

Important rules:

- `Lesson` is the stable identity and position in a learning path.
- `LessonVersion` stores editable/publishable content.
- Published content should be read from a `LessonVersion` with `status = PUBLISHED`.
- Editing a published lesson should create a new version or draft revision instead of silently changing the content already completed by students.
- `Lesson.prerequisiteLessonId` controls learning-path dependencies.
- `LessonBlock.content` is JSON. Validate it with the existing lesson block schemas before writing it.
- Preserve block order with `LessonBlock.order`.

### Learning records

- `StudentLessonProgress` is the current progress snapshot.
- `LessonSession` records a single learning session.
- `LessonAttempt` records a submitted lesson/quiz attempt.
- `BlockAttempt` and `StudentResponse` store question-level evidence.
- `MasteryRecord` stores objective-level mastery.
- `LearningEvent` is an append-only event/audit stream.

### Gamification

- `RewardTransaction` is the authoritative XP ledger.
- `Student.totalXpCache` and `currentLevelCache` are derived caches, not the financial-style source of truth.
- `LevelDefinition` defines thresholds.
- `BadgeDefinition` and `BadgeAward` handle achievements.
- `StreakRecord` stores current and longest streak data.

Reward writes should be transactional and idempotent. Use `idempotencyKey` to prevent duplicate XP when a client retries a request.

### Curriculum imports

`CurriculumImport` stores uploaded curriculum metadata, extracted text, generated JSON, validation results, model information, status, and errors. Large original files should normally be stored in object storage; keep only their metadata and a secure object key/URL in PostgreSQL.

## 8. Data that is still browser-only

The following must be migrated to backend APIs:

| Current area | Current storage | Backend destination |
| --- | --- | --- |
| Admin lessons | `skulkid-admin-lessons-v1` | `Lesson`, `LessonVersion`, objectives and blocks |
| Lesson order | `skulkid-admin-lesson-order-v1` | `Lesson.order` and prerequisites |
| Manual lesson draft | `skulkid-manual-lesson-draft` | Draft `LessonVersion` or a new editor-draft table |
| Student profile and avatar | `skulkid-student-profile-v1` | Extend `Student` and add avatar/profile models |
| Student XP, quiz state and rewards | game-state local storage | Progress, attempts, reward ledger, badges and streaks |
| Admin dashboard defaults | local storage | User/admin settings table |

The relevant client implementations are:

- `lib/admin/lesson-library.ts`
- `lib/student/student-profile.ts`
- `lib/gamification/student-game.ts`
- `components/admin/user-dashboard-settings.tsx`

Do not delete the browser storage implementation until the database API is working and existing development records can be migrated or safely discarded.

## 9. Schema additions to decide before backend work

The current Prisma schema does not yet model every feature visible in the UI. Agree on these additions before building their endpoints:

### Authentication and roles

Add an account/user model or connect an authentication provider. At minimum support:

- Student
- Teacher/content editor
- Administrator

Every `/admin` route and write endpoint requires server-side role checks.

### Student profile

The UI currently contains grade, school, biography, favourite subject, learning preferences, daily goal and avatar configuration. Only some of these exist on `Student`.

Recommended options:

- Add profile fields directly to `Student`, or
- Add a one-to-one `StudentProfile`.

### Avatar economy

Add models for:

- Avatar asset catalogue
- Asset category and price
- Student-owned assets
- Currently equipped assets
- Point balance or a point transaction ledger

Redemption must run in one transaction: verify balance, deduct points, create ownership, and reject duplicate ownership.

### Schools and guardians

If the platform will support real schools, classes or parent accounts, design those relationships before adding ad-hoc `school` strings to production records.

### Editor drafts

The lesson builder contains rich text sections, images, videos, worked examples, quizzes, and incomplete optional fields. Decide whether autosaved editor state belongs in:

- A JSON `LessonDraft` table, or
- A draft `LessonVersion` plus draft blocks.

## 10. Recommended server module

Create one shared Prisma client for the Next.js server runtime, for example `lib/server/db.ts`:

```ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({ connectionString });

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

Only import this module from server components, route handlers, server actions, scripts, and background jobs. Never import Prisma into a `"use client"` component.

## 11. First API implementation order

Recommended order:

1. Authentication and admin role protection.
2. Read published subjects, units, topics and lessons.
3. Admin CRUD for lessons and draft lesson versions.
4. Publish a lesson version transactionally.
5. Student profile read/update.
6. Lesson session and quiz submission.
7. Progress, XP ledger, stars, badges and streaks.
8. Avatar catalogue, redemption and equipment.
9. Curriculum import persistence and job status.

Suggested route boundaries:

```text
GET    /api/subjects
GET    /api/subjects/:slug/lessons
GET    /api/lessons/:id
POST   /api/admin/lessons
PATCH  /api/admin/lessons/:id
POST   /api/admin/lessons/:id/publish
GET    /api/students/me
PATCH  /api/students/me
POST   /api/lessons/:id/sessions
POST   /api/lessons/:id/attempts
GET    /api/students/me/progress
GET    /api/avatar/assets
POST   /api/avatar/assets/:id/redeem
PATCH  /api/students/me/avatar
```

Route names may change, but keep domain responsibilities separate.

## 12. Transaction and integrity requirements

Use database transactions for:

- Publishing a lesson and archiving/replacing a previous published version.
- Submitting an attempt, updating progress and awarding XP.
- Redeeming an avatar asset.
- Awarding a badge and its XP.
- Reversing a reward transaction.

Additional rules:

- Never trust scores, XP amounts, prices, roles or ownership sent by the browser.
- Calculate quiz scores and rewards on the server.
- Use the stored lesson version for grading, not the latest mutable editor state.
- Store all timestamps in UTC.
- Treat `LearningEvent` and `RewardTransaction` as append-only.
- Paginate lesson libraries, leaderboards and event history.
- Use soft archival statuses where history must be preserved.

## 13. Publishing query rule

Student pages must only receive published lessons. A typical Prisma query should constrain the version:

```ts
const lessons = await db.lesson.findMany({
  where: {
    versions: {
      some: { status: "PUBLISHED" }
    }
  },
  include: {
    topic: { include: { unit: { include: { subject: true } } } },
    versions: {
      where: { status: "PUBLISHED" },
      orderBy: { versionNumber: "desc" },
      take: 1,
      include: {
        objectives: { orderBy: { order: "asc" } },
        blocks: { orderBy: { order: "asc" } }
      }
    }
  },
  orderBy: { order: "asc" }
});
```

Draft and in-review versions must never be returned by public student endpoints.

## 14. Backend completion checklist

- [ ] PostgreSQL development database is running.
- [ ] `DATABASE_URL` is configured locally.
- [ ] Initial migration is generated, reviewed and committed.
- [ ] Prisma Client generates successfully.
- [ ] Seed runs successfully.
- [ ] Prisma Studio shows subjects, lessons, levels and badges.
- [ ] Shared server-only Prisma client is added.
- [ ] Authentication and admin roles are enforced.
- [ ] Published lesson read endpoints are database-backed.
- [ ] Admin draft, edit and publish flows are database-backed.
- [ ] Student progress and quiz submission are server-authoritative.
- [ ] Reward and avatar redemption writes are transactional.
- [ ] `localStorage` adapters are replaced after API integration.
- [ ] Preview and production databases use committed migrations.
- [ ] Backup, restore and monitoring are configured for production.

## 15. Important source files

- `prisma/schema.prisma` — database models and enums
- `prisma.config.ts` — Prisma 7 datasource and migration configuration
- `prisma/seed.ts` — curriculum, level and badge seed data
- `domains/curriculum/types.ts` — curriculum domain types
- `domains/curriculum/schemas` and `lib/validation` — content validation
- `lib/admin/lesson-library.ts` — temporary browser lesson persistence
- `lib/gamification/student-game.ts` — temporary browser game state
- `lib/student/student-profile.ts` — temporary browser student profile

