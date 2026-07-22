import { describe, expect, it } from "vitest";
import { englishCurriculum } from "@/domains/curriculum/fixtures/english-curriculum";
import { validateLessonForPublishing } from "@/domains/curriculum/services/publishing-validation";

describe("Ghana English curriculum", () => {
  it("covers every official Upper Primary strand at Basic 4, 5 and 6", () => {
    expect(englishCurriculum.units).toHaveLength(3);
    expect(englishCurriculum.topics).toHaveLength(18);
    expect(englishCurriculum.lessons).toHaveLength(18);
    expect(englishCurriculum.lessonVersions).toHaveLength(18);
  });

  it("publishes structurally valid, playable missions", () => {
    for (const version of englishCurriculum.lessonVersions) {
      const result = validateLessonForPublishing(version, englishCurriculum.lessons);
      expect(result.valid, `${version.title}: ${result.issues.map((issue) => issue.message).join(", ")}`).toBe(true);
    }
  });

  it("keeps a stable linear prerequisite path", () => {
    expect(englishCurriculum.lessons[0].prerequisiteLessonId).toBeNull();
    for (let index = 1; index < englishCurriculum.lessons.length; index += 1) {
      expect(englishCurriculum.lessons[index].prerequisiteLessonId).toBe(englishCurriculum.lessons[index - 1].id);
    }
  });
});
