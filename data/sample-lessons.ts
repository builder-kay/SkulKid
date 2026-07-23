import { sampleCurriculum } from "@/domains/curriculum/fixtures/sample-curriculum";
import type { LessonBlock as DomainLessonBlock, LessonVersion } from "@/domains/curriculum/types";
import { lessonSchema, parseLessonData } from "@/lib/validation/lesson-schemas";
import type { Lesson, LessonBlock } from "@/types/lesson";

function activeVersionForLesson(lessonId: string): LessonVersion {
  const version = sampleCurriculum.lessonVersions.find(
    (candidate) => candidate.lessonId === lessonId && candidate.status === "published"
  );

  if (!version) {
    throw new Error(`No published version found for ${lessonId}.`);
  }

  return version;
}

export const sampleLessons: Lesson[] = sampleCurriculum.lessons.map((stableLesson) => {
  const version = activeVersionForLesson(stableLesson.id);
  const topic = sampleCurriculum.topics.find((candidate) => candidate.id === stableLesson.topicId);
  const unit = topic
    ? sampleCurriculum.units.find((candidate) => candidate.id === topic.unitId)
    : undefined;

  const lesson: Lesson = {
    id: stableLesson.id,
    subjectId: unit?.subjectId ?? "subject-mathematics",
    unitId: unit?.id ?? "unit-fractions",
    topicId: stableLesson.topicId,
    title: version.title,
    slug: stableLesson.slug,
    description: version.description,
    objective: version.objectiveSummary,
    difficulty: version.difficulty === "challenge" ? "advanced" : "beginner",
    estimatedMinutes: version.estimatedMinutes,
    xpReward: version.baseXpReward,
    order: stableLesson.order,
    prerequisiteLessonId: stableLesson.prerequisiteLessonId,
    blocks: version.blocks.map(toLegacyBlock),
    status: version.status === "published" ? "published" : "draft",
    createdAt: version.createdAt,
    updatedAt: version.updatedAt
  };

  return parseLessonData(lessonSchema, lesson, lesson.title);
});

export function getSampleLessonById(lessonId: string): Lesson | undefined {
  return sampleLessons.find((lesson) => lesson.id === lessonId);
}

function toLegacyBlock(block: DomainLessonBlock): LessonBlock {
  switch (block.type) {
    case "lesson_intro":
      return {
        id: block.id,
        type: "introduction",
        order: block.order,
        title: block.title,
        content: block.shortDescription,
        objective: block.objectives.join(" ")
      };
    case "text":
      return {
        id: block.id,
        type: "text",
        order: block.order,
        heading: block.heading,
        content: block.body,
        emphasisTerms: block.emphasisTerms
      };
    case "image":
      return {
        id: block.id,
        type: "image",
        order: block.order,
        imageUrl: block.source,
        altText: block.altText,
        caption: block.caption ?? ""
      };
    case "video":
      return { id: block.id, type: "video", order: block.order, videoUrl: block.source, title: block.title, caption: block.caption };
    case "worked_example":
      return {
        id: block.id,
        type: "example",
        order: block.order,
        title: block.title,
        content: [block.problem, "", ...block.orderedSteps.map((step, index) => `${index + 1}. ${step}`)].join("\n"),
        explanation: block.explanation,
        finalAnswer: block.finalAnswer
      };
    case "tip":
      return {
        id: block.id,
        type: "tip",
        order: block.order,
        title: block.title,
        content: block.body
      };
    case "checkpoint":
      return {
        id: block.id,
        type: "tip",
        order: block.order,
        title: "Checkpoint",
        content: block.prompt
      };
    case "summary":
      return {
        id: block.id,
        type: "summary",
        order: block.order,
        heading: block.heading,
        points: [...block.keyPoints, block.nextStepText]
      };
    case "multiple_choice":
      return {
        id: block.id,
        type: "multiple_choice",
        order: block.order,
        question: block.prompt,
        options: block.options,
        correctOptionId: block.correctOptionId,
        explanation: block.explanation,
        hint: block.hint,
        xpReward: Math.round(10 * block.xpWeight)
      };
    case "multiple_select":
      return {
        id: block.id,
        type: "multiple_choice",
        order: block.order,
        question: `${block.prompt} (Preview shows the first correct answer.)`,
        options: block.options,
        correctOptionId: block.correctOptionIds[0],
        explanation: block.explanation,
        hint: block.hint,
        xpReward: Math.round(10 * block.xpWeight)
      };
    case "true_false":
      return {
        id: block.id,
        type: "true_false",
        order: block.order,
        statement: block.statement,
        correctAnswer: block.correctAnswer,
        explanation: block.explanation,
        hint: block.hint,
        xpReward: Math.round(10 * block.xpWeight)
      };
    case "fill_blank":
      return {
        id: block.id,
        type: "fill_blank",
        order: block.order,
        sentence: block.promptTemplate.replaceAll(/{{[^}]+}}/g, "____"),
        acceptedAnswers: block.blanks.flatMap((blank) => blank.acceptedAnswers),
        caseSensitive: block.caseSensitive,
        explanation: block.explanation,
        hint: block.hint,
        xpReward: Math.round(10 * block.xpWeight)
      };
    case "section_break":
      return {
        id: block.id,
        type: "text",
        order: block.order,
        heading: block.heading,
        content: block.description ?? ""
      };
    case "reflection":
      return {
        id: block.id,
        type: "tip",
        order: block.order,
        title: "Reflection",
        content: block.prompt
      };
    default:
      return assertNever(block);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unsupported curriculum block: ${JSON.stringify(value)}`);
}
