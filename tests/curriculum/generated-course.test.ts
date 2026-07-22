import { describe, expect, it } from "vitest";
import { generatedCourseSchema } from "@/domains/curriculum-ai/schemas/generated-course";
import { materialiseGeneratedCourse } from "@/domains/curriculum-ai/services/materialise-course";

const generated = generatedCourseSchema.parse({
  title: "Ghana Science Quest", subject: "science",
  sourceSummary: "A Basic 4 course about materials and evidence-based observation.",
  designRationale: "Short missions move from observation to explanation and retrieval.",
  units: [{ title: "Materials", description: "Investigate and explain properties of everyday materials.", grade: 4, topics: [{ title: "Properties", description: "Observe properties and use evidence to classify materials.", lessons: [{
    title: "Material Detectives", description: "Use observable properties to describe and group materials.", curriculumReferences: ["B4.1.1.1"],
    objectives: ["Describe two observable material properties.", "Classify materials using evidence."], estimatedMinutes: 10, difficulty: "beginner",
    teachingHeading: "Look closely", teachingText: "A property is something we can observe or measure, such as texture, colour, hardness or flexibility.",
    exampleTitle: "Sort the objects", exampleProblem: "A spoon is hard and shiny while a cloth is soft and flexible.",
    exampleSteps: ["Observe each object safely.", "Name a property.", "Group objects sharing that property."], exampleAnswer: "Group by observable property.",
    challenge: { prompt: "Which is an observable property?", options: ["flexibility", "owner", "price"], correctOptionIndex: 0, hint: "Choose something you can test safely.", explanation: "Flexibility can be observed by checking whether a material bends." },
    trueFalseStatement: "Evidence from observations can support a classification.", trueFalseAnswer: true,
    summaryPoints: ["Properties can be observed or measured.", "A classification should be supported by evidence."]
  }] }] }]
});

describe("AI curriculum materialisation", () => {
  it("allows more than four learning objectives", () => {
    const lesson = generated.units[0].topics[0].lessons[0];
    const result = generatedCourseSchema.safeParse({ ...generated, units: [{ ...generated.units[0], topics: [{ ...generated.units[0].topics[0], lessons: [{ ...lesson, objectives: ["Identify observable properties.", "Describe observable properties.", "Compare materials using evidence.", "Classify materials by their properties.", "Explain the chosen classification."] }] }] }] });
    expect(result.success).toBe(true);
  });

  it("converts a generated draft into valid SkulKid curriculum data", () => {
    const result = materialiseGeneratedCourse(generated, "abcdef1234567890");
    expect(result.fixture.subjects[0].name).toBe("Science");
    expect(result.fixture.lessonVersions[0].status).toBe("draft");
    expect(result.issues.filter((issue) => issue.severity === "error")).toEqual([]);
  });

  it("creates stable assessment answer IDs and objective references", () => {
    const { fixture } = materialiseGeneratedCourse(generated, "abcdef1234567890");
    const version = fixture.lessonVersions[0];
    const question = version.blocks.find((block) => block.type === "multiple_choice");
    if (question?.type !== "multiple_choice") throw new Error("Expected a multiple choice block.");
    expect(question.options.some((option) => option.id === question.correctOptionId)).toBe(true);
    expect(question.learningObjectiveIds).toEqual(version.learningObjectives.map((objective) => objective.id));
  });

  it("creates a video-only instructional lesson when selected", () => {
    const { fixture } = materialiseGeneratedCourse(generated, "video1234567890", { includeText: false, includeWorkedExample: false, video: { url: "https://youtu.be/M7lc1UVf-VE", title: "Material properties" } });
    const types = fixture.lessonVersions[0].blocks.map((block) => block.type);
    expect(types).toContain("video");
    expect(types).not.toContain("text");
    expect(types).not.toContain("worked_example");
  });

  it("keeps text, worked example and video blocks for blended lessons", () => {
    const { fixture } = materialiseGeneratedCourse(generated, "blend123456789", { includeText: true, includeWorkedExample: true, video: { url: "https://vimeo.com/123456789", title: "Material properties" } });
    const types = fixture.lessonVersions[0].blocks.map((block) => block.type);
    expect(types).toEqual(expect.arrayContaining(["text", "video", "worked_example"]));
  });
});
