/**
 * Rebuild subject-wide lesson positions from module order, then lesson order inside each module.
 * Overrides let a module supply an explicit lesson id sequence (for reorder / attach).
 */
export function buildCourseLessonOrder(
  unitIdsInOrder: string[],
  lessons: Array<{ id: string; unitId: string | null }>,
  overrides: Record<string, string[]> = {}
) {
  const used = new Set<string>();
  const finalOrder: string[] = [];

  for (const unitId of unitIdsInOrder) {
    const ids = overrides[unitId]
      ?? lessons.filter((lesson) => (lesson.unitId ?? "") === unitId).map((lesson) => lesson.id);
    for (const id of ids) {
      if (used.has(id)) continue;
      used.add(id);
      finalOrder.push(id);
    }
  }

  for (const lesson of lessons) {
    if (used.has(lesson.id)) continue;
    used.add(lesson.id);
    finalOrder.push(lesson.id);
  }

  return finalOrder;
}
