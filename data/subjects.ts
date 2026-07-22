import type { Subject } from "@/types/subject";

export const mathematicsSubjectId = "subject-mathematics";
export const fractionsUnitId = "unit-fractions";
export const understandingFractionsTopicId = "topic-understanding-fractions";

export const subjects: Subject[] = [
  {
    id: mathematicsSubjectId,
    name: "Mathematics",
    slug: "mathematics",
    description: "Build number confidence through clear examples, practice and feedback.",
    color: "#2563EB",
    units: [
      {
        id: fractionsUnitId,
        subjectId: mathematicsSubjectId,
        title: "Fractions",
        slug: "fractions",
        description: "Learn how parts make a whole and how fractions can be compared.",
        order: 1,
        topics: [
          {
            id: understandingFractionsTopicId,
            unitId: fractionsUnitId,
            title: "Understanding Fractions",
            slug: "understanding-fractions",
            description: "Explore fraction meaning, parts and comparison.",
            order: 1,
            lessonIds: [
              "lesson-introduction-to-fractions",
              "lesson-parts-of-a-fraction",
              "lesson-comparing-fractions"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "subject-english-language",
    name: "English Language",
    slug: "english-language",
    description: "Grow reading, writing and communication confidence.",
    color: "#7C3AED",
    units: [4, 5, 6].map((grade, gradeIndex) => ({
      id: `unit-english-basic-${grade}`,
      subjectId: "subject-english-language",
      title: `Basic ${grade}`,
      slug: `basic-${grade}`,
      description: `Ghana standards-based English missions for Basic ${grade}.`,
      order: gradeIndex + 1,
      topics: [
        ["oral", "Oral Language"], ["reading", "Reading"], ["grammar", "Grammar Usage"],
        ["writing", "Writing"], ["conventions", "Writing Conventions"], ["extensive", "Extensive Reading"]
      ].map(([key, title], topicIndex) => ({
        id: `topic-english-b${grade}-${key}`,
        unitId: `unit-english-basic-${grade}`,
        title,
        slug: key,
        description: `Build ${title.toLowerCase()} knowledge and confidence.`,
        order: topicIndex + 1,
        lessonIds: [`lesson-english-b${grade}-${key}`]
      }))
    }))
  },
  {
    id: "subject-science",
    name: "Science",
    slug: "science",
    description: "Explore living things, materials, energy and everyday discovery.",
    color: "#16A34A",
    units: []
  }
];
