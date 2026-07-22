import { curriculumFixtureSchema } from "@/domains/curriculum/schemas/lesson-version-schemas";
import type { CurriculumFixture, LessonVersion } from "@/domains/curriculum/types";
import { englishCurriculum } from "@/domains/curriculum/fixtures/english-curriculum";

const timestamp = "2026-07-21T00:00:00.000Z";
const subjectId = "subject-mathematics";
const unitId = "unit-fractions";
const topicId = "topic-understanding-fractions";

function assessmentDefaults(objectiveIds: string[]) {
  return {
    learningObjectiveIds: objectiveIds,
    difficulty: "beginner" as const,
    xpWeight: 1,
    maximumAttempts: 2,
    hint: "Think about the equal parts first.",
    explanation: "Fractions describe equal parts of a whole.",
    feedbackCorrect: "Correct. You used the fraction idea well.",
    feedbackIncorrect: "Not yet. Look again at the parts and the whole.",
    feedbackRetry: "Good effort. Try one more time with the hint.",
    shuffleOptions: false
  };
}

function objectives(lessonVersionId: string, codes: string[]) {
  return codes.map((code, index) => ({
    id: `${lessonVersionId}-objective-${index + 1}`,
    lessonVersionId,
    code,
    description:
      index === 0
        ? "Identify equal parts of a whole."
        : "Use fraction language to explain a simple situation.",
    order: index + 1
  }));
}

const introductionObjectives = objectives("lesson-introduction-to-fractions-v1", ["FRAC-INTRO-1", "FRAC-INTRO-2"]);
const partsObjectives = objectives("lesson-parts-of-a-fraction-v1", ["FRAC-PARTS-1", "FRAC-PARTS-2"]);
const comparingObjectives = objectives("lesson-comparing-fractions-v1", ["FRAC-COMPARE-1", "FRAC-COMPARE-2"]);

const lessonVersions: LessonVersion[] = [
  {
    id: "lesson-introduction-to-fractions-v1",
    lessonId: "lesson-introduction-to-fractions",
    versionNumber: 1,
    status: "published",
    title: "Introduction to Fractions",
    description: "Meet fractions as equal parts of a whole.",
    objectiveSummary: "Understand that a fraction describes equal parts of one whole.",
    difficulty: "beginner",
    estimatedMinutes: 12,
    baseXpReward: 80,
    passingScore: 60,
    masteryScore: 80,
    publishedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    learningObjectives: introductionObjectives,
    blocks: [
      {
        id: "intro-fractions-1",
        type: "lesson_intro",
        order: 1,
        required: true,
        estimatedSeconds: 60,
        title: "Fractions Are Parts",
        shortDescription: "A fraction helps us talk about equal parts.",
        objectives: introductionObjectives.map((objective) => objective.description),
        estimatedMinutes: 12,
        rewardPreview: { xp: 80, starsAvailable: 3 }
      },
      {
        id: "intro-fractions-2",
        type: "text",
        order: 2,
        required: true,
        estimatedSeconds: 120,
        heading: "What Makes a Fraction?",
        body: "Fractions are used when a whole is split into equal parts. One out of two equal parts is one half. One out of four equal parts is one quarter.",
        emphasisTerms: ["equal parts", "whole"]
      },
      {
        id: "intro-fractions-3",
        type: "image",
        order: 3,
        required: false,
        estimatedSeconds: 60,
        source: "/placeholders/orange-fractions.svg",
        altText: "One orange divided into four equal pieces with one piece highlighted.",
        caption: "One highlighted piece out of four equal orange pieces is one quarter.",
        decorative: false
      },
      {
        id: "intro-fractions-4",
        type: "worked_example",
        order: 4,
        required: true,
        estimatedSeconds: 120,
        title: "Sharing Bread",
        problem: "A slice of bread is cut into two equal pieces. Kofi eats one piece.",
        orderedSteps: ["Count the equal pieces: 2.", "Count the pieces eaten: 1.", "Write 1 out of 2 as 1/2."],
        finalAnswer: "1/2",
        explanation: "That amount is called one half."
      },
      {
        id: "intro-fractions-5",
        type: "multiple_choice",
        order: 5,
        required: true,
        estimatedSeconds: 90,
        prompt: "A mango is cut into 4 equal pieces. Ama eats 1 piece. What fraction did she eat?",
        options: [
          { id: "a", label: "A", text: "1/2", feedback: "That would be one out of two parts." },
          { id: "b", label: "B", text: "1/4", feedback: "Yes, one out of four equal parts." },
          { id: "c", label: "C", text: "4/1", feedback: "That means four wholes." }
        ],
        correctOptionId: "b",
        ...assessmentDefaults([introductionObjectives[0].id])
      },
      {
        id: "intro-fractions-6",
        type: "true_false",
        order: 6,
        required: true,
        estimatedSeconds: 60,
        prompt: "Fractions and equal parts",
        statement: "Fractions should describe equal parts of a whole.",
        correctAnswer: true,
        ...assessmentDefaults([introductionObjectives[1].id])
      },
      {
        id: "intro-fractions-7",
        type: "summary",
        order: 7,
        required: true,
        estimatedSeconds: 60,
        heading: "Remember",
        keyPoints: ["A fraction names part of a whole.", "The parts must be equal.", "1/4 means 1 out of 4 equal parts."],
        nextStepText: "Next you will learn the names of the parts of a fraction."
      }
    ]
  },
  {
    id: "lesson-parts-of-a-fraction-v1",
    lessonId: "lesson-parts-of-a-fraction",
    versionNumber: 1,
    status: "published",
    title: "Parts of a Fraction",
    description: "Learn what the top and bottom numbers in a fraction mean.",
    objectiveSummary: "Identify the numerator and denominator in simple fractions.",
    difficulty: "beginner",
    estimatedMinutes: 14,
    baseXpReward: 90,
    passingScore: 60,
    masteryScore: 80,
    publishedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    learningObjectives: partsObjectives,
    blocks: [
      {
        id: "parts-fraction-1",
        type: "lesson_intro",
        order: 1,
        required: true,
        estimatedSeconds: 60,
        title: "Two Helpful Numbers",
        shortDescription: "A fraction has two numbers. Each number has a job.",
        objectives: partsObjectives.map((objective) => objective.description),
        estimatedMinutes: 14,
        rewardPreview: { xp: 90, starsAvailable: 3 }
      },
      {
        id: "parts-fraction-2",
        type: "text",
        order: 2,
        required: true,
        estimatedSeconds: 120,
        heading: "Numerator and Denominator",
        body: "The numerator is the top number. It tells how many parts we have. The denominator is the bottom number. It tells how many equal parts make the whole."
      },
      {
        id: "parts-fraction-3",
        type: "image",
        order: 3,
        required: false,
        estimatedSeconds: 60,
        source: "/placeholders/fraction-parts.svg",
        altText: "The fraction three fifths with the top number labelled numerator and bottom number labelled denominator.",
        caption: "In 3/5, 3 is the numerator and 5 is the denominator.",
        decorative: false
      },
      {
        id: "parts-fraction-4",
        type: "tip",
        order: 4,
        required: false,
        estimatedSeconds: 45,
        title: "Quick Check",
        body: "The denominator is down below. It tells the number of equal parts in the whole.",
        tone: "remember"
      },
      {
        id: "parts-fraction-5",
        type: "multiple_choice",
        order: 5,
        required: true,
        estimatedSeconds: 90,
        prompt: "In the fraction 2/6, which number is the denominator?",
        options: [
          { id: "a", label: "A", text: "2" },
          { id: "b", label: "B", text: "6" },
          { id: "c", label: "C", text: "8" }
        ],
        correctOptionId: "b",
        ...assessmentDefaults([partsObjectives[0].id])
      },
      {
        id: "parts-fraction-6",
        type: "fill_blank",
        order: 6,
        required: true,
        estimatedSeconds: 90,
        prompt: "Find the numerator",
        promptTemplate: "In 3/8, the numerator is {{numerator}}.",
        blanks: [{ id: "numerator", label: "numerator", acceptedAnswers: ["3", "three"] }],
        caseSensitive: false,
        ignoreExtraWhitespace: true,
        ...assessmentDefaults([partsObjectives[1].id])
      },
      {
        id: "parts-fraction-7",
        type: "summary",
        order: 7,
        required: true,
        estimatedSeconds: 60,
        heading: "Key Parts",
        keyPoints: ["The numerator tells how many parts are counted.", "The denominator tells how many equal parts make one whole."],
        nextStepText: "Now you can compare fractions with matching denominators."
      }
    ]
  },
  {
    id: "lesson-comparing-fractions-v1",
    lessonId: "lesson-comparing-fractions",
    versionNumber: 1,
    status: "published",
    title: "Comparing Fractions",
    description: "Compare simple fractions using equal wholes and common denominators.",
    objectiveSummary: "Decide which simple fraction is greater when the wholes are the same size.",
    difficulty: "beginner",
    estimatedMinutes: 16,
    baseXpReward: 100,
    passingScore: 60,
    masteryScore: 80,
    publishedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    learningObjectives: comparingObjectives,
    blocks: [
      {
        id: "compare-fractions-1",
        type: "lesson_intro",
        order: 1,
        required: true,
        estimatedSeconds: 60,
        title: "Which Part Is Bigger?",
        shortDescription: "Compare fractions from the same size whole.",
        objectives: comparingObjectives.map((objective) => objective.description),
        estimatedMinutes: 16,
        rewardPreview: { xp: 100, starsAvailable: 3 }
      },
      {
        id: "compare-fractions-2",
        type: "text",
        order: 2,
        required: true,
        estimatedSeconds: 120,
        heading: "Same Denominator",
        body: "If two fractions have the same denominator, compare the numerators. The larger numerator means more equal parts are counted."
      },
      {
        id: "compare-fractions-3",
        type: "worked_example",
        order: 3,
        required: true,
        estimatedSeconds: 120,
        title: "Water Containers",
        problem: "Two equal containers are marked in sixths. One has 2/6 water and the other has 5/6 water.",
        orderedSteps: ["Check the denominators: both are sixths.", "Compare the numerators: 5 is greater than 2."],
        finalAnswer: "5/6 is greater than 2/6.",
        explanation: "The same denominator means the parts are the same size."
      },
      {
        id: "compare-fractions-4",
        type: "multiple_choice",
        order: 4,
        required: true,
        estimatedSeconds: 90,
        prompt: "Which fraction is greater?",
        options: [
          { id: "a", label: "A", text: "3/7" },
          { id: "b", label: "B", text: "5/7" },
          { id: "c", label: "C", text: "They are equal" }
        ],
        correctOptionId: "b",
        ...assessmentDefaults([comparingObjectives[0].id])
      },
      {
        id: "compare-fractions-5",
        type: "multiple_select",
        order: 5,
        required: true,
        estimatedSeconds: 90,
        prompt: "Select every true statement.",
        options: [
          { id: "same-denominator", label: "A", text: "Same denominators make parts the same size." },
          { id: "larger-numerator", label: "B", text: "With same denominators, the larger numerator is greater." },
          { id: "always-half", label: "C", text: "Every fraction is one half." }
        ],
        correctOptionIds: ["same-denominator", "larger-numerator"],
        partialCreditEnabled: true,
        ...assessmentDefaults([comparingObjectives[1].id])
      },
      {
        id: "compare-fractions-6",
        type: "fill_blank",
        order: 6,
        required: true,
        estimatedSeconds: 90,
        prompt: "Choose the greater fraction",
        promptTemplate: "Between 1/4 and 3/4, the greater fraction is {{greater}}.",
        blanks: [{ id: "greater", label: "greater fraction", acceptedAnswers: ["3/4", "three fourths", "three quarters"] }],
        caseSensitive: false,
        ignoreExtraWhitespace: true,
        ...assessmentDefaults([comparingObjectives[1].id])
      },
      {
        id: "compare-fractions-7",
        type: "summary",
        order: 7,
        required: true,
        estimatedSeconds: 60,
        heading: "Compare Carefully",
        keyPoints: ["Compare fractions from the same size whole.", "If denominators match, compare numerators."],
        nextStepText: "You are ready for more fraction practice."
      }
    ]
  }
];

const rawFixture: CurriculumFixture = {
  subjects: [
    {
      id: subjectId,
      name: "Mathematics",
      slug: "mathematics",
      description: "Build number confidence through clear examples, practice and feedback.",
      icon: "calculator",
      colourToken: "subject-mathematics",
      gradeLevels: [4, 5, 6],
      order: 1,
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ],
  units: [
    {
      id: unitId,
      subjectId,
      name: "Fractions",
      slug: "fractions",
      description: "Learn how parts make a whole and how fractions can be compared.",
      order: 1,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ],
  topics: [
    {
      id: topicId,
      unitId,
      name: "Understanding Fractions",
      slug: "understanding-fractions",
      description: "Explore fraction meaning, parts and comparison.",
      order: 1,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ],
  lessons: [
    {
      id: "lesson-introduction-to-fractions",
      topicId,
      title: "Introduction to Fractions",
      slug: "introduction-to-fractions",
      shortDescription: "Meet fractions as equal parts of a whole.",
      order: 1,
      prerequisiteLessonId: null,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "lesson-parts-of-a-fraction",
      topicId,
      title: "Parts of a Fraction",
      slug: "parts-of-a-fraction",
      shortDescription: "Learn what the top and bottom numbers in a fraction mean.",
      order: 2,
      prerequisiteLessonId: "lesson-introduction-to-fractions",
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "lesson-comparing-fractions",
      topicId,
      title: "Comparing Fractions",
      slug: "comparing-fractions",
      shortDescription: "Compare simple fractions using equal wholes and common denominators.",
      order: 3,
      prerequisiteLessonId: "lesson-parts-of-a-fraction",
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ],
  lessonVersions
};

export const sampleCurriculum = curriculumFixtureSchema.parse({
  subjects: [...rawFixture.subjects, ...englishCurriculum.subjects],
  units: [...rawFixture.units, ...englishCurriculum.units],
  topics: [...rawFixture.topics, ...englishCurriculum.topics],
  lessons: [...rawFixture.lessons, ...englishCurriculum.lessons],
  lessonVersions: [...rawFixture.lessonVersions, ...englishCurriculum.lessonVersions]
});
