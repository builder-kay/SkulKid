import type { RewardSourceType, RewardTransaction } from "@/domains/gamification/types";

export type CreateRewardTransactionInput = {
  id: string;
  studentId: string;
  sourceType: RewardSourceType;
  sourceId: string;
  ruleKey: string;
  xpAmount: number;
  metadataJson?: Record<string, unknown>;
  idempotencyKey: string;
  awardedAt: string;
};

export function createRewardTransaction(
  input: CreateRewardTransactionInput,
  existingTransactions: RewardTransaction[]
) {
  if (!canAwardReward(input.idempotencyKey, existingTransactions)) {
    return {
      awarded: false,
      transaction: null,
      reason: "duplicate_idempotency_key"
    };
  }

  const transaction: RewardTransaction = {
    id: input.id,
    studentId: input.studentId,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    ruleKey: input.ruleKey,
    xpAmount: Math.max(0, input.xpAmount),
    metadataJson: input.metadataJson ?? {},
    idempotencyKey: input.idempotencyKey,
    awardedAt: input.awardedAt,
    reversedAt: null,
    reversalTransactionId: null
  };

  return { awarded: true, transaction, reason: "awarded" };
}

export function canAwardReward(idempotencyKey: string, transactions: RewardTransaction[]): boolean {
  return !transactions.some((transaction) => transaction.idempotencyKey === idempotencyKey);
}

export function calculateXpBalance(transactions: RewardTransaction[]): number {
  return transactions.reduce((total, transaction) => total + transaction.xpAmount, 0);
}

export function createRewardReversal(
  original: RewardTransaction,
  input: { id: string; awardedAt: string; idempotencyKey: string }
): RewardTransaction {
  return {
    id: input.id,
    studentId: original.studentId,
    sourceType: "reversal",
    sourceId: original.id,
    ruleKey: `reverse:${original.ruleKey}`,
    xpAmount: -original.xpAmount,
    metadataJson: { originalTransactionId: original.id },
    idempotencyKey: input.idempotencyKey,
    awardedAt: input.awardedAt,
    reversedAt: null,
    reversalTransactionId: original.id
  };
}
