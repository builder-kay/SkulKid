# AI Curriculum Studio

## Purpose

Curriculum Studio converts an educator-provided curriculum PDF or text file into a structured SkulKid course draft for Mathematics, English Language or Science. It is an authoring assistant, not an autonomous publisher.

## Processing boundary

1. The browser uploads a validated file to a server-only route.
2. The server sends the source and generation contract to the OpenAI Responses API.
3. Structured Outputs constrain the result to the generated-course JSON schema.
4. Zod validates the response again at the application boundary.
5. The materialiser creates stable curriculum entities and lesson blocks.
6. Existing publishing validation checks every lesson version.
7. The administrator reviews and downloads the draft.

The API key is read only from `OPENAI_API_KEY` on the server. It must never use a `NEXT_PUBLIC_` name or be sent to the browser.

## Subject rules

- Mathematics prioritises reasoning, worked steps and misconception-aware distractors.
- English prioritises meaningful listening, speaking, reading and writing use.
- Science distinguishes observations, evidence and explanations and requires safe contexts.

## Human oversight and privacy

AI output is untrusted draft data. Educators must review curriculum references, accuracy, age appropriateness, copyright, cultural context and assessment validity. A model response cannot directly create a published `LessonVersion`.

Curriculum uploads should not contain pupil personal data. Production must add authentication and role-based authorisation before exposing this admin route. Source retention should be encrypted, configurable and auditable.

## Configuration

```env
OPENAI_API_KEY=...
OPENAI_CURRICULUM_MODEL=gpt-5.6-terra
```

The current prototype does not persist drafts because Phase 1 has no administrator identity. The Prisma provenance model is ready for the authenticated workflow.
