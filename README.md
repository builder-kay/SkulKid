# SkulKid

SkulKid is a gamified e-learning platform foundation for primary school students aged about 9 to 12. Phase 1 focuses on the technical and domain base needed for future student lessons and admin-created content.

## Phase 1 Scope

This phase includes project architecture, design tokens, typed learning content, student progress models, gamification rules, Supabase persistence, authentication, access control, unit tests, and lesson previews.

It does not include production authentication, a teacher portal, an admin lesson builder, or the full student dashboard.

## Tech Stack

- Next.js 15 App Router
- TypeScript with strict settings
- Tailwind CSS
- Shadcn-style UI primitives
- Lucide React
- Framer Motion
- Supabase Database, Auth and Storage
- Zod
- Vitest and React Testing Library
- Playwright configuration for future E2E tests

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL="your Supabase project URL"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your Supabase publishable key"
SUPABASE_SERVICE_ROLE_KEY="your server-only Supabase secret key"
CLIFZE_API_KEY="your server-only Clifze API key"
CLIFZE_SENDER_ID="SkulKid"
```

## Authentication

Student accounts use Supabase Auth with a phone number and password. Clifze sends and verifies the six-digit code used to confirm signup and password resets.

1. Create a Supabase project and copy `.env.example` to `.env.local`.
2. Add the Supabase URL, publishable key and service-role key.
3. Enable the Phone provider in Supabase Authentication. Supabase does not send the verification message in this application; Clifze does.
4. Add the Clifze API key and an approved sender ID. Never prefix either secret with `NEXT_PUBLIC_`.
5. Run the SQL files in `supabase/migrations` using the Supabase SQL Editor.
6. Start the app.

Public account routes are `/login`, `/signup`, and `/forgot-password`. Student and admin routes require a Supabase session once the Supabase variables are configured. New accounts receive the `student` role. Assign `app_metadata.role = "admin"` from a trusted server or the Supabase dashboard for administrators.

The access flow is:

```text
Unauthenticated visitor
  -> /login or /signup
  -> Clifze phone verification for signup
  -> Supabase session cookie
  -> /dashboard for students or /admin for administrators
```

Opening `/`, a student route, an admin page, or an admin API directly cannot
bypass authentication. Student accounts receive `401/403` protection from
admin APIs, and authenticated users are redirected away from account screens
to the correct role home.

## Database

For the complete Supabase setup and migration order, see [DATABASE_SETUP.md](DATABASE_SETUP.md).

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
```

## Project Structure

```text
app/                       Next.js routes and global styles
components/                UI primitives, gamification UI, lesson player blocks
data/                      Validated sample subject, lessons and progress data
features/                  Future feature module boundaries
lib/                       Pure business rules, validation and utilities
supabase/migrations/       Supabase SQL schema and security policies
public/placeholders/       Local preview images
tests/unit/                Unit tests for rules and lesson unlocking
types/                     Shared domain contracts
```

## Learning Path

Phase 1 fully implements one sample Mathematics path:

```text
Mathematics
  Fractions
    Understanding Fractions
      Introduction to Fractions
      Parts of a Fraction
      Comparing Fractions
```

The lessons are ordered and connected with prerequisites.

## Gamification Rules

- Correct answer on first attempt: 10 XP
- Correct answer after retry: 5 XP
- Lesson completion: 30 XP
- Perfect lesson bonus: 20 XP
- Improved previous score bonus: 15 XP
- Daily goal completion: 25 XP
- Seven-day streak bonus: 50 XP
- Stars: completion gives 1 star, score >= 70 gives 2 stars, score >= 90 gives 3 stars
- Levels: every 500 XP increases level by 1, with a minimum level of 1

## Adaptive Learning Rules

- Score >= 80: mastered, unlock next lesson, continue
- Score 50 to 79: completed, unlock next lesson, targeted practice
- Score below 50: revision required, keep next lesson locked, remedial lesson

The engine is deterministic and rule-based. No machine learning is used in Phase 1.

## Preview Routes

- `/dashboard` shows the current student dashboard shell
- `/courses` shows course navigation
- `/courses/mathematics` shows the Mathematics learning path
- `/preview/lessons` lists the sample lessons and metadata
- `/preview/lessons/[lessonId]` renders all typed lesson blocks for a lesson
- `/preview/design-system` documents the design-system foundation
- `/admin/curriculum-studio` creates validated AI-assisted drafts from Mathematics, English and Science curriculum files

Question blocks support local preview interaction only. No progress is persisted yet.

## AI Curriculum Studio

Set `GEMINI_API_KEY` on the server and optionally set `GEMINI_MODEL` (defaults to `gemini-3.5-flash`). The Studio accepts PDF, TXT and Markdown curriculum files up to 10 MB, requests schema-constrained content from the Google Gemini API, converts it into SkulKid lesson versions and runs publishing validation. Generated content always remains a draft for educator review.

Do not expose the admin route publicly until authentication and administrator role checks are implemented. Never use a `NEXT_PUBLIC_` environment variable for the Gemini key.

## Domain Overview

- Curriculum: versioned lessons, learning objectives, strict block schemas and publishing validation
- Learning: progress snapshots, sessions, immutable attempts/responses, mastery and append-only events
- Gamification: XP ledger, reward rules, stars, levels, badges, streaks and explainable adaptation
- Design system: semantic tokens, accessible primitives and living documentation

## Known Phase 1 Limitations

- No authentication or real student accounts
- No production lesson player state machine
- Curriculum Studio is a development preview; it has no authentication, persistence or final publishing controls yet
- No database-backed content loading in the UI yet
- No E2E tests beyond Playwright configuration
- Admin-builder compatibility is modelled through LessonVersion and strict block schemas, but the builder UI is not implemented

## Next Planned Phase

Phase 2 should introduce the full student lesson player, persisted progress, authentication, dashboard foundations, and database-backed lesson retrieval.
