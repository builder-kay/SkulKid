export type CurriculumStatus = "active" | "archived";

export type LessonDifficulty = "foundation" | "beginner" | "developing" | "proficient" | "challenge";

export type LessonPublicationStatus = "draft" | "in_review" | "published" | "archived";

export type LessonBlockType =
  | "lesson_intro"
  | "text"
  | "image"
  | "video"
  | "worked_example"
  | "tip"
  | "checkpoint"
  | "summary"
  | "multiple_choice"
  | "multiple_select"
  | "true_false"
  | "fill_blank"
  | "section_break"
  | "reflection";

export type Subject = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  colourToken: string;
  gradeLevels: number[];
  order: number;
  status: CurriculumStatus;
  createdAt: string;
  updatedAt: string;
};

export type Unit = {
  id: string;
  subjectId: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type Topic = {
  id: string;
  unitId: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type Lesson = {
  id: string;
  topicId: string;
  title: string;
  slug: string;
  shortDescription: string;
  order: number;
  prerequisiteLessonId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LessonVersion = {
  id: string;
  lessonId: string;
  versionNumber: number;
  status: LessonPublicationStatus;
  title: string;
  description: string;
  objectiveSummary: string;
  difficulty: LessonDifficulty;
  estimatedMinutes: number;
  baseXpReward: number;
  passingScore: number;
  masteryScore: number;
  maximumLessonRedos?: number;
  publishedAt: string | null;
  learningObjectives: LearningObjective[];
  blocks: LessonBlock[];
  createdAt: string;
  updatedAt: string;
};

export type LearningObjective = {
  id: string;
  lessonVersionId: string;
  code: string;
  description: string;
  order: number;
};

export type BaseLessonBlock = {
  id: string;
  type: LessonBlockType;
  order: number;
  required: boolean;
  estimatedSeconds?: number;
};

export type RewardPreview = {
  xp: number;
  starsAvailable: number;
};

export type AssessmentOption = {
  id: string;
  label: string;
  text: string;
  feedback?: string;
};

export type AssessmentFields = {
  prompt: string;
  learningObjectiveIds: string[];
  difficulty: LessonDifficulty;
  xpWeight: number;
  maximumAttempts: number;
  hint?: string;
  explanation: string;
  feedbackCorrect: string;
  feedbackIncorrect: string;
  feedbackRetry: string;
  shuffleOptions: boolean;
};

export type LessonIntroBlock = BaseLessonBlock & {
  type: "lesson_intro";
  title: string;
  shortDescription: string;
  objectives: string[];
  estimatedMinutes: number;
  rewardPreview: RewardPreview;
};

export type TextBlock = BaseLessonBlock & {
  type: "text";
  heading: string;
  body: string;
  emphasisTerms?: string[];
};

export type ImageBlock = BaseLessonBlock & {
  type: "image";
  source: string;
  altText: string;
  caption?: string;
  attribution?: string;
  decorative: boolean;
};

export type VideoBlock = BaseLessonBlock & {
  type: "video";
  source: string;
  provider: "youtube" | "vimeo" | "tiktok";
  title: string;
  caption?: string;
  participationPrompt?: string;
  participationOptions?: Array<{ id: string; label: string; text: string; feedback?: string }>;
  participationCorrectOptionId?: string;
  participationExplanation?: string;
  participationXp?: number;
};

export type WorkedExampleBlock = BaseLessonBlock & {
  type: "worked_example";
  title: string;
  problem: string;
  orderedSteps: string[];
  finalAnswer: string;
  explanation: string;
};

export type TipBlock = BaseLessonBlock & {
  type: "tip";
  title: string;
  body: string;
  tone: "tip" | "remember" | "warning";
};

export type CheckpointBlock = BaseLessonBlock & {
  type: "checkpoint";
  prompt: string;
  acknowledgementLabel: string;
};

export type SummaryBlock = BaseLessonBlock & {
  type: "summary";
  heading: string;
  keyPoints: string[];
  nextStepText: string;
};

export type MultipleChoiceBlock = BaseLessonBlock &
  AssessmentFields & {
    type: "multiple_choice";
    options: AssessmentOption[];
    correctOptionId: string;
  };

export type MultipleSelectBlock = BaseLessonBlock &
  AssessmentFields & {
    type: "multiple_select";
    options: AssessmentOption[];
    correctOptionIds: string[];
    partialCreditEnabled: boolean;
  };

export type TrueFalseBlock = BaseLessonBlock &
  AssessmentFields & {
    type: "true_false";
    statement: string;
    correctAnswer: boolean;
  };

export type FillBlankBlank = {
  id: string;
  label: string;
  acceptedAnswers: string[];
};

export type FillBlankBlock = BaseLessonBlock &
  AssessmentFields & {
    type: "fill_blank";
    promptTemplate: string;
    blanks: FillBlankBlank[];
    caseSensitive: boolean;
    ignoreExtraWhitespace: boolean;
  };

export type SectionBreakBlock = BaseLessonBlock & {
  type: "section_break";
  heading: string;
  description?: string;
};

export type ReflectionBlock = BaseLessonBlock & {
  type: "reflection";
  prompt: string;
  responseType: "short_text" | "confidence_scale";
  optional: boolean;
};

export type LessonBlock =
  | LessonIntroBlock
  | TextBlock
  | ImageBlock
  | VideoBlock
  | WorkedExampleBlock
  | TipBlock
  | CheckpointBlock
  | SummaryBlock
  | MultipleChoiceBlock
  | MultipleSelectBlock
  | TrueFalseBlock
  | FillBlankBlock
  | SectionBreakBlock
  | ReflectionBlock;

export type ValidationIssue = {
  code: string;
  field?: string;
  blockId?: string;
  severity: "error" | "warning";
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  issues: ValidationIssue[];
};

export type CurriculumFixture = {
  subjects: Subject[];
  units: Unit[];
  topics: Topic[];
  lessons: Lesson[];
  lessonVersions: LessonVersion[];
};
