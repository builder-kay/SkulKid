import type { BlockAttempt, MasteryRecord, MasteryStatus } from "@/domains/learning/types";

export type MasteryEvidence = {
  score: number;
  occurredAt: string;
};

export function calculateObjectiveMastery(evidence: MasteryEvidence[]) {
  if (evidence.length === 0) {
    return { masteryStatus: "not_started" as MasteryStatus, masteryScore: 0 };
  }

  const ordered = [...evidence].sort((first, second) => first.occurredAt.localeCompare(second.occurredAt));
  const weightedTotal = ordered.reduce((total, item, index) => total + item.score * (index + 1), 0);
  const weightTotal = ordered.reduce((total, _item, index) => total + index + 1, 0);
  const masteryScore = Math.round((weightedTotal / weightTotal) * 100) / 100;

  return {
    masteryScore,
    masteryStatus: masteryStatusFromScore(masteryScore)
  };
}

export function updateMasteryFromAttempt(
  current: MasteryRecord,
  evidence: MasteryEvidence[],
  at: string
): MasteryRecord {
  const result = calculateObjectiveMastery(evidence);

  return {
    ...current,
    masteryStatus: result.masteryStatus,
    masteryScore: result.masteryScore,
    evidenceCount: evidence.length,
    lastEvidenceAt: evidence.length > 0 ? at : current.lastEvidenceAt,
    updatedAt: at
  };
}

export function evidenceFromBlockAttempt(attempt: BlockAttempt, submittedAt: string): MasteryEvidence {
  const score = attempt.scorePossible === 0 ? 0 : (attempt.scoreEarned / attempt.scorePossible) * 100;
  return { score, occurredAt: submittedAt };
}

function masteryStatusFromScore(score: number): MasteryStatus {
  if (score >= 80) {
    return "mastered";
  }
  if (score >= 60) {
    return "proficient";
  }
  if (score >= 40) {
    return "developing";
  }
  return "emerging";
}
