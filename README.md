# SkulKid

SkulKid is a gamified e-learning platform foundation for primary school students aged about 9 to 12. Phase 1 focuses on the technical and domain base needed for future student lessons and admin-created content.

## Phase 1 Scope

This phase includes project architecture, design tokens, typed learning content, discriminated lesson blocks, sample Mathematics lessons, student progress models, gamification rules, adaptive-learning rules, Prisma models, unit tests, and an internal lesson preview.

It does not include production authentication, a teacher portal, an admin lesson builder, or the full student dashboard.

## Tech Stack

- Next.js 15 App Router
- TypeScript with strict settings
- Tailwind CSS
- Shadcn-style UI primitives
- Lucide React
- Framer Motion
- PostgreSQL
- Prisma ORM
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
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/skulkid?schema=public"
```

Prisma 7 uses `prisma.config.ts` for the datasource URL.

## Database

Create a PostgreSQL database named `skulkid`, then run:

```bash
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed
```

Validate the schema with:

```bash
npm run prisma:validate
```

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run prisma:validate
npm run prisma:seed
```

## Project Structure

```text
app/                       Next.js routes and global styles
components/                UI primitives, gamification UI, lesson player blocks
data/                      Validated sample subject, lessons and progress data
features/                  Future feature module boundaries
lib/                       Pure business rules, validation and utilities
prisma/                    Prisma schema and seed script
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
