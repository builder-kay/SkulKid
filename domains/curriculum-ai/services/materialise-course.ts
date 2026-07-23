import { curriculumFixtureSchema } from "@/domains/curriculum/schemas/lesson-version-schemas";
import { validateLessonForPublishing } from "@/domains/curriculum/services/publishing-validation";
import type { CurriculumFixture, Lesson, LessonBlock, LessonDifficulty, LessonVersion, ValidationIssue } from "@/domains/curriculum/types";
import type { GeneratedCourse } from "@/domains/curriculum-ai/schemas/generated-course";
import { resolveVideoEmbed } from "@/lib/video/embed";

export type MaterialisedCourse = { fixture: CurriculumFixture; issues: ValidationIssue[] };

export type MaterialiseOptions = {
  baseXpReward?: number;
  passingScore?: number;
  masteryScore?: number;
  maximumAttempts?: number;
  maximumLessonRedos?: number;
  includeTrueFalse?: boolean;
  video?: { url: string; title: string; caption?: string; participationPrompt?: string; participationOptions?: Array<{ id: string; label: string; text: string }>; participationCorrectOptionId?: string; participationExplanation?: string; participationXp?: number };
  videos?: Array<{ url: string; title: string; caption?: string; participationPrompt?: string; participationOptions?: Array<{ id: string; label: string; text: string }>; participationCorrectOptionId?: string; participationExplanation?: string; participationXp?: number }>;
  contentSections?: Array<{ heading: string; body: string; imageUrl?: string; imageAlt?: string; imageCaption?: string; videoUrl?: string; videoTitle?: string; videoCaption?: string }>;
  includeText?: boolean;
  includeWorkedExample?: boolean;
  includeAssessment?: boolean;
  additionalChallenges?: Array<{
    prompt: string;
    options: [string, string, string];
    correctOptionIndex: number;
    hint: string;
    explanation: string;
  }>;
};

export function materialiseGeneratedCourse(course: GeneratedCourse, importKey: string, options: MaterialiseOptions = {}): MaterialisedCourse {
  const timestamp = new Date().toISOString();
  const prefix = `ai-${importKey.slice(0, 10)}`;
  const subjectId = `${prefix}-subject`;
  const units: CurriculumFixture["units"] = [];
  const topics: CurriculumFixture["topics"] = [];
  const lessons: Lesson[] = [];
  const lessonVersions: LessonVersion[] = [];
  let previousLessonId: string | null = null;
  let globalLessonOrder = 0;

  course.units.forEach((generatedUnit, unitIndex) => {
    const unitId = `${prefix}-unit-${unitIndex + 1}-${slug(generatedUnit.title)}`;
    units.push({ id: unitId, subjectId, name: generatedUnit.title, slug: slug(generatedUnit.title), description: generatedUnit.description, order: unitIndex + 1, createdAt: timestamp, updatedAt: timestamp });

    generatedUnit.topics.forEach((generatedTopic, topicIndex) => {
      const topicId = `${prefix}-topic-${unitIndex + 1}-${topicIndex + 1}-${slug(generatedTopic.title)}`;
      topics.push({ id: topicId, unitId, name: generatedTopic.title, slug: slug(generatedTopic.title), description: generatedTopic.description, order: topicIndex + 1, createdAt: timestamp, updatedAt: timestamp });

      generatedTopic.lessons.forEach((generatedLesson) => {
        globalLessonOrder += 1;
        const lessonId = `${prefix}-lesson-${globalLessonOrder}-${slug(generatedLesson.title)}`;
        const versionId = `${lessonId}-v1`;
        const objectiveIds = generatedLesson.objectives.map((_, index) => `${versionId}-objective-${index + 1}`);
        const lesson: Lesson = { id: lessonId, topicId, title: generatedLesson.title, slug: slug(generatedLesson.title), shortDescription: generatedLesson.description, order: globalLessonOrder, prerequisiteLessonId: previousLessonId, createdAt: timestamp, updatedAt: timestamp };
        lessons.push(lesson);
        previousLessonId = lessonId;

        const feedback = {
          learningObjectiveIds: objectiveIds,
          difficulty: generatedLesson.difficulty,
          xpWeight: 1,
          maximumAttempts: options.maximumAttempts ?? 2,
          hint: generatedLesson.challenge.hint,
          explanation: generatedLesson.challenge.explanation,
          feedbackCorrect: "Great work. You used the idea accurately.",
          feedbackIncorrect: "Not yet. Look for the clue in the example.",
          feedbackRetry: "Good effort. Use the hint and try once more.",
          shuffleOptions: false
        };
        const challenges = [generatedLesson.challenge, ...(options.additionalChallenges ?? [])];
        let nextContentOrder = 2;
        const contentBlocks: LessonBlock[] = [];
        if (options.contentSections?.length) {
          options.contentSections.forEach((section, index) => {
            if (section.body.trim()) contentBlocks.push({ id: `${versionId}-section-${index + 1}`, type: "text", order: nextContentOrder++, required: true, estimatedSeconds: 120, heading: section.heading.trim() || `Section ${index + 1}`, body: section.body });
            if (section.imageUrl?.trim()) contentBlocks.push({ id: `${versionId}-section-${index + 1}-image`, type: "image", order: nextContentOrder++, required: false, estimatedSeconds: 30, source: section.imageUrl.trim(), altText: section.imageAlt?.trim() || "Lesson illustration", caption: section.imageCaption?.trim() || undefined, decorative: false });
            const embed = section.videoUrl ? resolveVideoEmbed(section.videoUrl) : null;
            if (embed && section.videoUrl) contentBlocks.push({ id: `${versionId}-section-${index + 1}-video`, type: "video", order: nextContentOrder++, required: false, estimatedSeconds: 300, source: section.videoUrl, provider: embed.provider, title: section.videoTitle?.trim() || section.heading || `Section ${index + 1} video`, caption: section.videoCaption?.trim() || undefined });
          });
        } else {
          if (options.includeText !== false) contentBlocks.push({ id: `${versionId}-teach`, type: "text", order: nextContentOrder++, required: true, estimatedSeconds: 120, heading: generatedLesson.teachingHeading, body: generatedLesson.teachingText });
          const videoInputs = options.videos ?? (options.video ? [options.video] : []);
          videoInputs.forEach((video, index) => { const embed = resolveVideoEmbed(video.url); if (embed) contentBlocks.push({ id: `${versionId}-video-${index + 1}`, type: "video", order: nextContentOrder++, required: true, estimatedSeconds: 300, source: video.url, provider: embed.provider, title: video.title, caption: video.caption || undefined, participationPrompt: video.participationPrompt?.trim() || undefined, participationOptions: video.participationOptions, participationCorrectOptionId: video.participationCorrectOptionId, participationExplanation: video.participationExplanation?.trim() || undefined, participationXp: video.participationPrompt?.trim() && video.participationCorrectOptionId ? (video.participationXp ?? 5) : undefined }); });
        }
        const exampleOrder = options.includeWorkedExample === false ? null : nextContentOrder++;
        const assessmentStart = nextContentOrder;
        const assessmentBlocks: LessonBlock[] = options.includeAssessment === false ? [] : challenges.map((challenge, challengeIndex) => ({
          id: `${versionId}-question-${challengeIndex + 1}`,
          type: "multiple_choice",
          order: assessmentStart + challengeIndex,
          required: true,
          estimatedSeconds: 75,
          prompt: challenge.prompt,
          options: challenge.options.map((text, index) => ({ id: `question-${challengeIndex + 1}-option-${index + 1}`, label: String.fromCharCode(65 + index), text })),
          correctOptionId: `question-${challengeIndex + 1}-option-${challenge.correctOptionIndex + 1}`,
          ...feedback,
          hint: challenge.hint,
          explanation: challenge.explanation
        }));
        const blocks: LessonBlock[] = [
          { id: `${versionId}-intro`, type: "lesson_intro", order: 1, required: true, estimatedSeconds: 45, title: generatedLesson.title, shortDescription: generatedLesson.description, objectives: generatedLesson.objectives, estimatedMinutes: generatedLesson.estimatedMinutes, rewardPreview: { xp: options.baseXpReward ?? 100, starsAvailable: 3 } },
          ...contentBlocks,
          ...(exampleOrder ? [{ id: `${versionId}-example`, type: "worked_example" as const, order: exampleOrder, required: true, estimatedSeconds: 120, title: generatedLesson.exampleTitle, problem: generatedLesson.exampleProblem, orderedSteps: generatedLesson.exampleSteps, finalAnswer: generatedLesson.exampleAnswer, explanation: generatedLesson.challenge.explanation }] : []),
          ...assessmentBlocks,
          ...(options.includeTrueFalse === false ? [] : [{ id: `${versionId}-check`, type: "true_false" as const, order: assessmentStart + assessmentBlocks.length, required: true, estimatedSeconds: 60, prompt: "Final checkpoint", statement: generatedLesson.trueFalseStatement, correctAnswer: generatedLesson.trueFalseAnswer, ...feedback }]),
          { id: `${versionId}-summary`, type: "summary", order: assessmentStart + assessmentBlocks.length + (options.includeTrueFalse === false ? 0 : 1), required: true, estimatedSeconds: 45, heading: "Mission complete", keyPoints: generatedLesson.summaryPoints, nextStepText: "Continue when you are ready for the next mission." }
        ];
        lessonVersions.push({ id: versionId, lessonId, versionNumber: 1, status: "draft", title: generatedLesson.title, description: generatedLesson.description, objectiveSummary: generatedLesson.objectives.join(" "), difficulty: generatedLesson.difficulty as LessonDifficulty, estimatedMinutes: generatedLesson.estimatedMinutes, baseXpReward: options.baseXpReward ?? 100, passingScore: options.passingScore ?? 60, masteryScore: options.masteryScore ?? 80, maximumLessonRedos: options.maximumLessonRedos ?? 2, publishedAt: null, learningObjectives: generatedLesson.objectives.map((description, index) => ({ id: objectiveIds[index], lessonVersionId: versionId, code: generatedLesson.curriculumReferences[index] ?? `${course.subject.toUpperCase()}.${globalLessonOrder}.${index + 1}`, description, order: index + 1 })), blocks, createdAt: timestamp, updatedAt: timestamp });
      });
    });
  });

  const fixture = curriculumFixtureSchema.parse({
    subjects: [{ id: subjectId, name: subjectName(course.subject), slug: `${course.subject}-${importKey.slice(0, 8)}`, description: course.sourceSummary, icon: course.subject === "mathematics" ? "calculator" : course.subject === "science" ? "flask-conical" : "book-open", colourToken: `subject-${course.subject.replace("-language", "")}`, gradeLevels: [...new Set(course.units.map((unit) => unit.grade))], order: 1, status: "active", createdAt: timestamp, updatedAt: timestamp }],
    units, topics, lessons, lessonVersions
  });
  const issues = lessonVersions.flatMap((version) => validateLessonForPublishing(version, lessons).issues)
    .filter((issue) => options.includeAssessment !== false || issue.code !== "MISSING_ASSESSMENT");
  return { fixture, issues };
}

function slug(value: string) {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/(^-|-$)/g, "").slice(0, 60) || "untitled";
}

function subjectName(subject: GeneratedCourse["subject"]) {
  if (subject === "english-language") return "English Language";
  return subject[0].toUpperCase() + subject.slice(1);
}
