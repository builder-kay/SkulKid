"use client";

import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { FeedbackPanel } from "@/components/shared/feedback-panel";
import { SkulKidButton } from "@/components/shared/skulkid-button";
import { LessonBlockShell } from "@/components/lesson-player/lesson-block-shell";
import { cn } from "@/lib/utils";
import type { TrueFalseBlock } from "@/types/lesson";

export type TrueFalseBlockProps = {
  block: TrueFalseBlock;
  previewMode?: boolean;
  onAnswer?: (blockId: string, correct: boolean, attempts: number) => void;
};

export function TrueFalseBlockComponent({ block, previewMode = false, onAnswer }: TrueFalseBlockProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [checkedAnswer, setCheckedAnswer] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [awardedXp, setAwardedXp] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);

  const isCorrect = checkedAnswer === block.correctAnswer;
  const canCheck = selectedAnswer !== null && checkedAnswer === null;

  function checkAnswer() {
    if (selectedAnswer === null || checkedAnswer !== null) {
      return;
    }

    setCheckedAnswer(selectedAnswer);
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    onAnswer?.(block.id, selectedAnswer === block.correctAnswer, nextAttempts);
    if (selectedAnswer === block.correctAnswer) {
      setAwardedXp((current) => current ?? block.xpReward);
    }
  }

  return (
    <LessonBlockShell block={block}>
      <div className="space-y-4">
        <h2 className="text-xl font-bold">{block.statement}</h2>
        <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="True or false options">
          {[true, false].map((answer) => {
            const selected = selectedAnswer === answer;
            const checked = checkedAnswer !== null;
            const correct = checked && answer === block.correctAnswer;
            const incorrect = checked && selected && answer !== block.correctAnswer;

            return (
              <button
                aria-pressed={selected}
                className={cn(
                  "min-h-12 rounded-xl border bg-white px-4 py-3 text-left font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  selected ? "border-primary ring-2 ring-blue-100" : "border-slate-200",
                  correct && "border-green-500 bg-green-50",
                  incorrect && "border-red-500 bg-red-50"
                )}
                disabled={checked}
                key={String(answer)}
                onClick={() => setSelectedAnswer(answer)}
                type="button"
              >
                {answer ? "True" : "False"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <SkulKidButton disabled={!canCheck} onClick={checkAnswer} type="button">
          Check answer
        </SkulKidButton>
        {checkedAnswer !== null && !isCorrect ? (
          <SkulKidButton
            onClick={() => {
              setCheckedAnswer(null);
              setSelectedAnswer(null);
            }}
            type="button"
            variant="outline"
          >
            Try again
          </SkulKidButton>
        ) : null}
        {block.hint ? (
          <SkulKidButton
            aria-expanded={showHint}
            onClick={() => setShowHint((current) => !current)}
            type="button"
            variant="ghost"
          >
            <HelpCircle aria-hidden="true" className="size-4" />
            Hint
          </SkulKidButton>
        ) : null}
      </div>

      {showHint && block.hint ? (
        <FeedbackPanel className="mt-4" tone="info" title="Hint">
          {block.hint}
        </FeedbackPanel>
      ) : null}

      {checkedAnswer !== null ? (
        <FeedbackPanel
          className="mt-4"
          tone={isCorrect ? "success" : "danger"}
          title={isCorrect ? "Correct answer" : "Not quite yet"}
        >
          <p>{block.explanation}</p>
          {previewMode && isCorrect && awardedXp !== null ? (
            <p className="mt-1">Preview XP: +{awardedXp}</p>
          ) : null}
        </FeedbackPanel>
      ) : null}
    </LessonBlockShell>
  );
}
