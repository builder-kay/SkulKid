import { curriculumFixtureSchema } from "@/domains/curriculum/schemas/lesson-version-schemas";
import type { LessonBlock as DomainLessonBlock } from "@/domains/curriculum/types";
import type { AdminLessonRecord } from "@/lib/admin/lesson-library";
import type { Lesson, LessonBlock } from "@/types/lesson";

const subjectIds = { mathematics: "subject-mathematics", "english-language": "subject-english-language", science: "subject-science" } as const;

export function publishedLessonsFromRecords(records: AdminLessonRecord[]): Lesson[] {
  const published = records.filter((record) => record.status === "published");
  const orderedIds = new Map([...new Set(published.map((record) => record.courseId ?? subjectIds[record.subject]))].map((courseId) => [courseId, published.filter((record) => (record.courseId ?? subjectIds[record.subject]) === courseId).map((record) => record.id)]));

  return published.flatMap((record) => {
    const parsed = curriculumFixtureSchema.safeParse(record.fixture);
    if (!parsed.success) return [];
    const stable = parsed.data.lessons.find((lesson) => lesson.id === record.id) ?? parsed.data.lessons[0];
    const version = parsed.data.lessonVersions.find((candidate) => candidate.lessonId === stable?.id && candidate.status === "published")
      ?? parsed.data.lessonVersions.find((candidate) => candidate.lessonId === stable?.id)
      ?? parsed.data.lessonVersions[0];
    if (!stable || !version) return [];
    const courseId = record.courseId ?? subjectIds[record.subject];
    const ids = orderedIds.get(courseId) ?? [];
    return [{
      id: record.id,
      subjectId: courseId,
      unitId: record.unitId ?? `admin-unit-${slug(record.unit || record.subject)}`,
      topicId: record.topicId ?? `admin-topic-${slug(record.topic || record.chapter || record.unit)}`,
      title: record.title || version.title,
      slug: stable.slug || slug(record.title),
      description: record.description || version.description,
      objective: version.objectiveSummary,
      difficulty: version.difficulty === "challenge" ? "advanced" : "beginner",
      estimatedMinutes: record.estimatedMinutes || version.estimatedMinutes,
      xpReward: record.xp || version.baseXpReward,
      passingScore: record.gamification?.passingScore ?? version.passingScore,
      masteryScore: record.gamification?.masteryScore ?? version.masteryScore,
      order: Math.max(1, ids.indexOf(record.id) + 1),
      prerequisiteLessonId: record.prerequisiteLessonId ?? null,
      blocks: version.blocks.map(toLegacyBlock),
      status: "published",
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    } satisfies Lesson];
  }).sort((a, b) => a.subjectId.localeCompare(b.subjectId) || a.order - b.order);
}

function slug(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "course"; }

function toLegacyBlock(block: DomainLessonBlock): LessonBlock {
  switch (block.type) {
    case "lesson_intro": return { id: block.id, type: "introduction", order: block.order, title: block.title, content: block.shortDescription, objective: block.objectives.join(" ") };
    case "text": return { id: block.id, type: "text", order: block.order, heading: block.heading, content: block.body, emphasisTerms: block.emphasisTerms };
    case "image": return { id: block.id, type: "image", order: block.order, imageUrl: block.source, altText: block.altText, caption: block.caption ?? "" };
    case "video": return { id: block.id, type: "video", order: block.order, videoUrl: block.source, title: block.title, caption: block.caption, participationPrompt: block.participationPrompt, participationOptions: block.participationOptions, participationCorrectOptionId: block.participationCorrectOptionId, participationExplanation: block.participationExplanation, participationXp: block.participationXp };
    case "worked_example": return { id: block.id, type: "example", order: block.order, title: block.title, content: formatWorkedExample(block.problem, block.orderedSteps), explanation: block.explanation, finalAnswer: block.finalAnswer };
    case "tip": return { id: block.id, type: "tip", order: block.order, title: block.title, content: block.body };
    case "checkpoint": return { id: block.id, type: "tip", order: block.order, title: "Checkpoint", content: block.prompt };
    case "summary": return { id: block.id, type: "summary", order: block.order, heading: block.heading, points: [...block.keyPoints, block.nextStepText] };
    case "multiple_choice": return { id: block.id, type: "multiple_choice", order: block.order, question: block.prompt, options: block.options, correctOptionId: block.correctOptionId, explanation: block.explanation, hint: block.hint, xpReward: Math.round(10 * block.xpWeight) };
    case "multiple_select": return { id: block.id, type: "multiple_choice", order: block.order, question: block.prompt, options: block.options, correctOptionId: block.correctOptionIds[0], explanation: block.explanation, hint: block.hint, xpReward: Math.round(10 * block.xpWeight) };
    case "true_false": return { id: block.id, type: "true_false", order: block.order, statement: block.statement, correctAnswer: block.correctAnswer, explanation: block.explanation, hint: block.hint, xpReward: Math.round(10 * block.xpWeight) };
    case "fill_blank": return { id: block.id, type: "fill_blank", order: block.order, sentence: block.promptTemplate.replaceAll(/{{[^}]+}}/g, "____"), acceptedAnswers: block.blanks.flatMap((blank) => blank.acceptedAnswers), caseSensitive: block.caseSensitive, explanation: block.explanation, hint: block.hint, xpReward: Math.round(10 * block.xpWeight) };
    case "section_break": return { id: block.id, type: "text", order: block.order, heading: block.heading, content: block.description ?? "" };
    case "reflection": return { id: block.id, type: "tip", order: block.order, title: "Reflection", content: block.prompt };
  }
}

function formatWorkedExample(problem: string, orderedSteps: string[]) {
  const steps = orderedSteps.map((step, index) => `${index + 1}. ${step}`).join("\n");
  return `${problem}\n\n${steps}`.trim();
}
