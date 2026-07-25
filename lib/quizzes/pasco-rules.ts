export function quizHasEnded(input: { status: string; deadline: string | null }, now = Date.now()) {
  return input.status === "closed"
    || (input.status === "published" && Boolean(input.deadline) && new Date(input.deadline!).getTime() <= now);
}

export function scorePascoPractice(
  questions: Array<{ id: string; correctIndex: number }>,
  answers: Record<string, number>
) {
  if (!questions.length) return 0;
  const correct = questions.filter((question) => answers[question.id] === question.correctIndex).length;
  return Math.round(correct / questions.length * 100);
}
