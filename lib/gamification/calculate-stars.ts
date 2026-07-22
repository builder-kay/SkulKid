export function calculateStars(isCompleted: boolean, score: number): number {
  if (!isCompleted) {
    return 0;
  }

  if (score >= 90) {
    return 3;
  }

  if (score >= 70) {
    return 2;
  }

  return 1;
}
