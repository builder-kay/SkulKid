export type LessonDifficulty = "beginner" | "intermediate" | "advanced";

export type LessonStatus = "draft" | "published" | "archived";

export type AnswerOption = {
  id: string;
  label: string;
  text: string;
};

export type LessonBlockBase = {
  id: string;
  order: number;
};

export type IntroductionBlock = LessonBlockBase & {
  type: "introduction";
  title: string;
  content: string;
  objective: string;
};

export type TextBlock = LessonBlockBase & {
  type: "text";
  heading: string;
  content: string;
};

export type ImageBlock = LessonBlockBase & {
  type: "image";
  imageUrl: string;
  altText: string;
  caption: string;
};

export type VideoBlock = LessonBlockBase & {
  type: "video";
  videoUrl: string;
  title: string;
  caption?: string;
};

export type ExampleBlock = LessonBlockBase & {
  type: "example";
  title: string;
  content: string;
  explanation: string;
};

export type TipBlock = LessonBlockBase & {
  type: "tip";
  title: string;
  content: string;
};

export type MultipleChoiceBlock = LessonBlockBase & {
  type: "multiple_choice";
  question: string;
  options: AnswerOption[];
  correctOptionId: string;
  explanation: string;
  hint?: string;
  xpReward: number;
};

export type TrueFalseBlock = LessonBlockBase & {
  type: "true_false";
  statement: string;
  correctAnswer: boolean;
  explanation: string;
  hint?: string;
  xpReward: number;
};

export type FillBlankBlock = LessonBlockBase & {
  type: "fill_blank";
  sentence: string;
  acceptedAnswers: string[];
  caseSensitive: boolean;
  explanation: string;
  hint?: string;
  xpReward: number;
};

export type SummaryBlock = LessonBlockBase & {
  type: "summary";
  heading: string;
  points: string[];
};

export type LessonBlock =
  | IntroductionBlock
  | TextBlock
  | ImageBlock
  | VideoBlock
  | ExampleBlock
  | TipBlock
  | MultipleChoiceBlock
  | TrueFalseBlock
  | FillBlankBlock
  | SummaryBlock;

export type Lesson = {
  id: string;
  subjectId: string;
  unitId: string;
  topicId: string;
  title: string;
  slug: string;
  description: string;
  objective: string;
  difficulty: LessonDifficulty;
  estimatedMinutes: number;
  xpReward: number;
  passingScore?: number;
  masteryScore?: number;
  order: number;
  prerequisiteLessonId: string | null;
  blocks: LessonBlock[];
  status: LessonStatus;
  createdAt: string;
  updatedAt: string;
};
